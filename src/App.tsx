/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  DaySchedule,
  ScheduleTemplate,
  ScheduledBlock,
  RuleOfThreeItem
} from './types';
import {
  DEFAULT_TEMPLATES,
  getStoredSchedules,
  saveStoredSchedules,
  getStoredTemplates,
  saveStoredTemplates,
  getUserStoredSchedules,
  saveUserStoredSchedules,
  getUserStoredTemplates,
  saveUserStoredTemplates,
  getAllLocalSchedules,
  clearGuestStorage
} from './utils/storage';
import {
  getTodayISO,
  getMondayOfCurrentWeek,
  addDays,
  getWeekDays
} from './utils/dateUtils';
import { initAuth, signInWithGmail, signOutUser } from './utils/auth';
import {
  loadUserSchedulesFromFirestore,
  saveUserScheduleToFirestore,
  loadUserTemplatesFromFirestore,
  saveUserTemplateToFirestore,
  deleteUserTemplateFromFirestore,
  getFriendlyErrorMessage
} from './utils/firestoreService';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { DailyFocusView } from './components/DailyFocusView';
import { FourWeekReviewView } from './components/FourWeekReviewView';
import { TemplateStudio } from './components/TemplateStudio';
import { ApplyTemplateModal } from './components/ApplyTemplateModal';
import { BlockEditorModal } from './components/BlockEditorModal';
import {
  RotateCcw,
  ShieldCheck,
  X,
  Cloud,
  CloudOff,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<'daily' | 'fourWeeks' | 'templates'>('daily');
  const [currentDateISO, setCurrentDateISO] = useState<string>(getTodayISO());

  // Dark mode theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('tempo_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Auth & Cloud Sync State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [authNotification, setAuthNotification] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<{
    title: string;
    message: string;
    action?: () => void;
  } | null>(null);

  // User-scoped data state
  const [templates, setTemplates] = useState<ScheduleTemplate[]>(() => getStoredTemplates());
  const [schedules, setSchedules] = useState<Record<string, DaySchedule>>(() => getStoredSchedules());

  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('tempo_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('tempo_theme', 'light');
      }
    } catch (e) {
      console.error(e);
    }
  }, [isDark]);

  // Auth Listener, User Isolation, and Cloud Migration
  useEffect(() => {
    const unsubscribe = initAuth(async (currentUser) => {
      setUser(currentUser);
      setSyncError(null);

      if (currentUser) {
        setIsDataLoading(true);

        // 1. Immediately load user-isolated local cache if available for fast UI responsiveness
        const cachedUserSchedules = getUserStoredSchedules(currentUser.uid);
        if (Object.keys(cachedUserSchedules).length > 0) {
          setSchedules(cachedUserSchedules);
        }
        const cachedUserTemplates = getUserStoredTemplates(currentUser.uid);
        if (cachedUserTemplates && cachedUserTemplates.length > 0) {
          setTemplates(cachedUserTemplates);
        }

        try {
          // 2. Fetch authoritative cloud data from Firestore
          const [cloudTemplates, cloudSchedules] = await Promise.all([
            loadUserTemplatesFromFirestore(currentUser.uid),
            loadUserSchedulesFromFirestore(currentUser.uid)
          ]);

          // 3. RECOVER & MIGRATE: Gather any previously saved schedules (pre-Firebase legacy + guest + user caches)
          const allLocalSchedules = getAllLocalSchedules();
          const mergedSchedules: Record<string, DaySchedule> = {
            ...cachedUserSchedules,
            ...cloudSchedules
          };
          let migrationCount = 0;

          for (const [dateISO, localSched] of Object.entries(allLocalSchedules)) {
            if (!localSched) continue;
            const localHasBlocks = (localSched.blocks || []).length > 0;
            const localHasRule3 = (localSched.ruleOfThree || []).length > 0;
            const hasContent = localHasBlocks || localHasRule3 || Boolean(localSched.templateId);

            if (!hasContent) continue;

            const cloudDay = cloudSchedules[dateISO];
            const cloudHasBlocks = cloudDay && (cloudDay.blocks || []).length > 0;
            const cloudHasRule3 = cloudDay && (cloudDay.ruleOfThree || []).length > 0;

            // If date does not exist in cloud, or cloud day is empty while local day has content:
            if (!cloudDay || (!cloudHasBlocks && localHasBlocks) || (!cloudHasRule3 && localHasRule3)) {
              const scheduleToUpload: DaySchedule = {
                date: dateISO,
                templateId: localSched.templateId || cloudDay?.templateId,
                templateName: localSched.templateName || cloudDay?.templateName,
                ruleOfThree: (localSched.ruleOfThree?.length || 0) >= (cloudDay?.ruleOfThree?.length || 0)
                  ? localSched.ruleOfThree
                  : (cloudDay?.ruleOfThree || []),
                blocks: (localSched.blocks?.length || 0) >= (cloudDay?.blocks?.length || 0)
                  ? localSched.blocks
                  : (cloudDay?.blocks || []),
                dayNotes: localSched.dayNotes || cloudDay?.dayNotes
              };

              try {
                await saveUserScheduleToFirestore(currentUser.uid, scheduleToUpload);
                mergedSchedules[dateISO] = scheduleToUpload;
                migrationCount++;
              } catch (migErr) {
                console.warn(`Could not sync schedule for ${dateISO} during migration:`, migErr);
                mergedSchedules[dateISO] = scheduleToUpload;
              }
            }
          }

          // 4. Update state and cache for this user
          saveUserStoredSchedules(currentUser.uid, mergedSchedules);
          setSchedules(mergedSchedules);

          setTemplates(cloudTemplates);
          saveUserStoredTemplates(currentUser.uid, cloudTemplates);

          if (migrationCount > 0) {
            setAuthNotification(`Recovered and saved ${migrationCount} previously created schedule${migrationCount > 1 ? 's' : ''} to your cloud account.`);
            clearGuestStorage();
          }
        } catch (fetchErr: any) {
          console.error('Error loading user data from Firestore:', fetchErr);
          const friendlyMsg = getFriendlyErrorMessage(fetchErr);
          setSyncError({
            title: 'Cloud Schedule Loading Issue',
            message: friendlyMsg || 'Could not load your latest cloud schedule. Using cached version on this device.',
            action: () => {
              window.location.reload();
            }
          });
        } finally {
          setIsDataLoading(false);
        }
      } else {
        // User logged out: Immediately wipe active screen to protect privacy, restore guest state
        setSchedules(getStoredSchedules());
        setTemplates(getStoredTemplates());
      }
    });

    return () => unsubscribe();
  }, []);

  const handleToggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const handleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthNotification(null);
    setSyncError(null);
    try {
      const result = await signInWithGmail();
      if (result?.user) {
        setUser(result.user);
        setAuthNotification('Logged in with Gmail. Loading and syncing your schedules...');
      }
    } catch (err: any) {
      if (
        err?.code !== 'auth/popup-closed-by-user' &&
        err?.code !== 'auth/cancelled-popup-request' &&
        !err?.message?.includes('popup-closed-by-user')
      ) {
        const msg =
          err?.code === 'auth/popup-blocked'
            ? 'Sign-in popup was blocked. Please allow popups for this site and try again.'
            : 'Sign-in could not be completed. Please try again.';
        setSyncError({
          title: 'Sign-in Issue',
          message: msg,
          action: () => handleSignIn()
        });
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setUser(null);
      setSyncError(null);
      // Immediately reset state to protect user privacy
      setSchedules(getStoredSchedules());
      setTemplates(getStoredTemplates());
      setAuthNotification('Signed out. User data cleared from active screen.');
    } catch (err) {
      console.error('Sign-out failed', err);
    }
  };

  // Modals state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedTemplateForApply, setSelectedTemplateForApply] = useState<string | undefined>(undefined);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduledBlock | null>(null);

  // Save Schedule Handler (persists to local storage & Firestore)
  const handleUpdateSingleDaySchedule = async (updated: DaySchedule) => {
    setSyncError(null);
    const updatedSchedules = {
      ...schedules,
      [updated.date]: updated
    };
    setSchedules(updatedSchedules);

    if (user) {
      // 1. Immediately cache in user-isolated storage for zero data loss
      saveUserStoredSchedules(user.uid, updatedSchedules);
      // 2. Persist to Firestore
      try {
        await saveUserScheduleToFirestore(user.uid, updated);
      } catch (err: any) {
        console.error('Failed to sync schedule to Firestore:', err);
        setSyncError({
          title: 'Schedule Cloud Sync Failed',
          message: getFriendlyErrorMessage(err) || 'Changes are saved locally on this device, but could not be synced to Firestore cloud.',
          action: () => handleUpdateSingleDaySchedule(updated)
        });
      }
    } else {
      // Guest mode: save to guest storage
      saveStoredSchedules(updatedSchedules);
    }
  };

  // Save Templates Handler (persists to local storage & Firestore)
  const handleUpdateTemplates = async (newTemplates: ScheduleTemplate[]) => {
    setSyncError(null);
    setTemplates(newTemplates);

    if (user) {
      saveUserStoredTemplates(user.uid, newTemplates);
      try {
        for (const tpl of newTemplates) {
          await saveUserTemplateToFirestore(user.uid, tpl);
        }
      } catch (err: any) {
        console.error('Failed to sync templates to Firestore:', err);
        setSyncError({
          title: 'Template Cloud Sync Failed',
          message: getFriendlyErrorMessage(err) || 'Template changes were saved locally, but cloud sync failed.'
        });
      }
    } else {
      saveStoredTemplates(newTemplates);
    }
  };

  // Current day schedule accessor
  const currentSchedule: DaySchedule =
    schedules[currentDateISO] || {
      date: currentDateISO,
      ruleOfThree: [],
      blocks: []
    };

  // Template Application Handlers
  const handleOpenApplyModal = (templateId?: string) => {
    setSelectedTemplateForApply(templateId || templates[0]?.id);
    setIsApplyModalOpen(true);
  };

  const handleApplySingleDay = async (templateId: string, targetDateISO: string) => {
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;

    const baseDay = schedules[targetDateISO] || {
      date: targetDateISO,
      ruleOfThree: [],
      blocks: []
    };

    const newBlocks: ScheduledBlock[] = tpl.blocks.map(tb => ({
      id: `blk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: tb.title,
      startTime: tb.startTime,
      endTime: tb.endTime,
      category: tb.category,
      isFlexible: tb.isFlexible,
      subtasks: (tb.defaultSubtaskTitles || []).map(t => ({
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: t,
        completed: false,
        category: tb.category === 'school' ? 'school' : 'work'
      }))
    }));

    const updated: DaySchedule = {
      ...baseDay,
      templateId: tpl.id,
      templateName: tpl.name,
      blocks: newBlocks
    };

    await handleUpdateSingleDaySchedule(updated);
  };

  const handleBulkApplyToWeekdays = async (
    templateId: string,
    weekdayIndices: number[],
    weekCount: number
  ) => {
    setSyncError(null);
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;

    const currentMonday = getMondayOfCurrentWeek(currentDateISO);
    const updatedAll = { ...schedules };
    const modifiedDates: string[] = [];

    for (let w = 0; w < weekCount; w++) {
      const mondayISO = addDays(currentMonday, w * 7);
      for (const dayIdx of weekdayIndices) {
        const targetDate = addDays(mondayISO, dayIdx);
        const baseDay = updatedAll[targetDate] || {
          date: targetDate,
          ruleOfThree: [],
          blocks: []
        };

        const newBlocks: ScheduledBlock[] = tpl.blocks.map(tb => ({
          id: `blk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: tb.title,
          startTime: tb.startTime,
          endTime: tb.endTime,
          category: tb.category,
          isFlexible: tb.isFlexible,
          subtasks: (tb.defaultSubtaskTitles || []).map(t => ({
            id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: t,
            completed: false,
            category: tb.category === 'school' ? 'school' : 'work'
          }))
        }));

        const updated: DaySchedule = {
          ...baseDay,
          templateId: tpl.id,
          templateName: tpl.name,
          blocks: newBlocks
        };

        updatedAll[targetDate] = updated;
        modifiedDates.push(targetDate);
      }
    }

    setSchedules(updatedAll);

    if (user) {
      saveUserStoredSchedules(user.uid, updatedAll);
      try {
        for (const d of modifiedDates) {
          await saveUserScheduleToFirestore(user.uid, updatedAll[d]);
        }
      } catch (err: any) {
        console.error('Failed to sync bulk schedule to Firestore:', err);
        setSyncError({
          title: 'Bulk Schedule Cloud Sync Issue',
          message: getFriendlyErrorMessage(err) || 'Weekly schedules were updated locally, but some dates could not be synced to Firestore cloud.'
        });
      }
    } else {
      saveStoredSchedules(updatedAll);
    }
  };

  // Block Modal Save Handler
  const handleSaveBlock = async (
    blockData: Omit<ScheduledBlock, 'id'>,
    existingId?: string
  ) => {
    const currentBlocks = currentSchedule.blocks || [];

    if (existingId) {
      const updatedBlocks = currentBlocks.map(b =>
        b.id === existingId ? { ...blockData, id: existingId } : b
      );
      await handleUpdateSingleDaySchedule({
        ...currentSchedule,
        blocks: updatedBlocks
      });
    } else {
      const newBlock: ScheduledBlock = {
        ...blockData,
        id: `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      };
      await handleUpdateSingleDaySchedule({
        ...currentSchedule,
        blocks: [...currentBlocks, newBlock]
      });
    }
  };

  const handleOpenEditBlock = (block: ScheduledBlock) => {
    setEditingBlock(block);
    setIsBlockModalOpen(true);
  };

  const handleOpenAddBlock = () => {
    setEditingBlock(null);
    setIsBlockModalOpen(true);
  };

  const handleResetData = () => {
    if (confirm('Reset schedules and reload default templates?')) {
      setSchedules({});
      setTemplates(DEFAULT_TEMPLATES);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header strictly compliant with Top Bar Contract & Gmail Auth */}
      <Header
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenQuickApply={() => handleOpenApplyModal()}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        user={user}
        isAuthLoading={isAuthLoading}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Guest Mode Advisory Banner */}
      {!user && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <CloudOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Guest Mode:</strong> Sign in with Gmail to save and access your personal schedule securely. Your data is strictly private and isolated to your account.
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isAuthLoading}
              className="text-xs font-semibold underline hover:text-amber-950 dark:hover:text-white self-start sm:self-auto cursor-pointer"
            >
              Sign in with Gmail →
            </button>
          </div>
        </div>
      )}

      {/* Cloud Sync Indicator Banner */}
      {user && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900/60 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Firebase Cloud Sync active for your account. All schedules and blocks are securely isolated.
              </span>
            </div>
            {isDataLoading && (
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Syncing...
              </span>
            )}
          </div>
        </div>
      )}

      {/* Optional Notification Toast */}
      {authNotification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
          <div className="p-3 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-lg text-xs flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
              <span>{authNotification}</span>
            </div>
            <button
              type="button"
              onClick={() => setAuthNotification(null)}
              className="p-1 hover:opacity-70 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Sync Error Banner */}
      {syncError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-semibold">{syncError.title}: </span>
                <span>{syncError.message}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {syncError.action && (
                <button
                  type="button"
                  onClick={syncError.action}
                  className="px-2.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors cursor-pointer"
                >
                  Retry
                </button>
              )}
              <button
                type="button"
                onClick={() => setSyncError(null)}
                className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded transition-colors cursor-pointer"
                title="Dismiss error"
              >
                <X className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeView === 'daily' && (
          <DailyFocusView
            currentDateISO={currentDateISO}
            onDateChange={setCurrentDateISO}
            schedule={currentSchedule}
            templates={templates}
            onUpdateSchedule={handleUpdateSingleDaySchedule}
            onOpenApplyTemplate={() => handleOpenApplyModal()}
            onOpenAddBlock={handleOpenAddBlock}
            onEditBlock={handleOpenEditBlock}
          />
        )}

        {activeView === 'fourWeeks' && (
          <FourWeekReviewView
            schedules={schedules}
            templates={templates}
            onSelectDay={dateISO => {
              setCurrentDateISO(dateISO);
              setActiveView('daily');
            }}
            onOpenApplyTemplate={() => handleOpenApplyModal()}
          />
        )}

        {activeView === 'templates' && (
          <TemplateStudio
            templates={templates}
            onSaveTemplates={handleUpdateTemplates}
            onApplyTemplateModal={tplId => {
              handleOpenApplyModal(tplId);
            }}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 mt-auto transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Tempo</span>
            <span aria-hidden="true">·</span>
            <span>Rule of 3 & Flexible Schedule Architecture</span>
            <span aria-hidden="true">·</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
              {user ? 'Cloud Sync Active (User-Isolated)' : 'Guest Mode'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleResetData}
              className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset current view schedules"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Current View</span>
            </button>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span>Firestore Security Rules Active</span>
          </div>
        </div>
      </footer>

      {/* Apply Template Modal */}
      {isApplyModalOpen && (
        <ApplyTemplateModal
          isOpen={isApplyModalOpen}
          onClose={() => {
            setIsApplyModalOpen(false);
            setSelectedTemplateForApply(undefined);
          }}
          templates={templates}
          currentDateISO={currentDateISO}
          initialTemplateId={selectedTemplateForApply}
          onApplySingleDay={handleApplySingleDay}
          onBulkApplyToWeekdays={handleBulkApplyToWeekdays}
        />
      )}

      {/* Block Editor Modal */}
      {isBlockModalOpen && (
        <BlockEditorModal
          isOpen={isBlockModalOpen}
          onClose={() => {
            setIsBlockModalOpen(false);
            setEditingBlock(null);
          }}
          onSave={handleSaveBlock}
          editingBlock={editingBlock}
        />
      )}
    </div>
  );
}
