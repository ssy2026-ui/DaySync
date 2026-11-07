import React from 'react';
import { DaySchedule, ScheduledBlock, RuleOfThreeItem, ScheduleTemplate } from '../types';
import { RuleOfThreeTracker } from './RuleOfThreeTracker';
import { OverbookingGuardrail } from './OverbookingGuardrail';
import { BatchedTimeBlockCard } from './BatchedTimeBlockCard';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Bookmark,
  Layers,
  ArrowRight
} from 'lucide-react';
import { addDays, formatDayHeader, getTodayISO } from '../utils/dateUtils';

interface DailyFocusViewProps {
  currentDateISO: string;
  onDateChange: (dateISO: string) => void;
  schedule: DaySchedule;
  templates: ScheduleTemplate[];
  onUpdateSchedule: (updated: DaySchedule) => void;
  onOpenApplyTemplate: () => void;
  onOpenAddBlock: () => void;
  onEditBlock: (block: ScheduledBlock) => void;
}

export const DailyFocusView: React.FC<DailyFocusViewProps> = ({
  currentDateISO,
  onDateChange,
  schedule,
  templates,
  onUpdateSchedule,
  onOpenApplyTemplate,
  onOpenAddBlock,
  onEditBlock
}) => {
  const { weekday, dateFormatted, isToday } = formatDayHeader(currentDateISO);

  // Rule of 3 Handlers
  const handleAddRuleOfThreeItem = (title: string, category: 'school' | 'work') => {
    if (schedule.ruleOfThree.length >= 3) return;
    const newItem: RuleOfThreeItem = {
      id: `mit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      category,
      completed: false
    };
    onUpdateSchedule({
      ...schedule,
      ruleOfThree: [...schedule.ruleOfThree, newItem]
    });
  };

  const handleToggleRuleOfThree = (id: string) => {
    onUpdateSchedule({
      ...schedule,
      ruleOfThree: schedule.ruleOfThree.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    });
  };

  const handleDeleteRuleOfThree = (id: string) => {
    onUpdateSchedule({
      ...schedule,
      ruleOfThree: schedule.ruleOfThree.filter(item => item.id !== id)
    });
  };

  const handleUpdateRuleOfThreeTitle = (id: string, newTitle: string) => {
    onUpdateSchedule({
      ...schedule,
      ruleOfThree: schedule.ruleOfThree.map(item =>
        item.id === id ? { ...item, title: newTitle } : item
      )
    });
  };

  // Block Handlers
  const handleUpdateBlock = (updated: ScheduledBlock) => {
    onUpdateSchedule({
      ...schedule,
      blocks: schedule.blocks.map(b => (b.id === updated.id ? updated : b))
    });
  };

  const handleDeleteBlock = (blockId: string) => {
    onUpdateSchedule({
      ...schedule,
      blocks: schedule.blocks.filter(b => b.id !== blockId)
    });
  };

  // Sort blocks chronologically
  const sortedBlocks = [...schedule.blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6">
      {/* Date Navigation & Template Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onDateChange(addDays(currentDateISO, -1))}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Previous day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => onDateChange(addDays(currentDateISO, 1))}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Next day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {weekday}
              </h1>
              {isToday && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md">
                  Today
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {dateFormatted}
            </span>
          </div>
        </div>

        {/* Date actions & Template state */}
        <div className="flex flex-wrap items-center gap-2.5">
          {!isToday && (
            <button
              type="button"
              onClick={() => onDateChange(getTodayISO())}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Jump to Today
            </button>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-800/50">
            <Bookmark className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Template:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {schedule.templateName || 'Custom'}
            </span>
            <button
              type="button"
              onClick={onOpenApplyTemplate}
              className="ml-2 text-slate-900 dark:text-slate-100 font-semibold hover:underline cursor-pointer"
            >
              Change
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenAddBlock}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Block</span>
          </button>
        </div>
      </div>

      {/* Grid: Rule of 3 (Top Focus) & Overbooking Guard (Workload Health) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RuleOfThreeTracker
          items={schedule.ruleOfThree}
          onAddItem={handleAddRuleOfThreeItem}
          onToggleItem={handleToggleRuleOfThree}
          onDeleteItem={handleDeleteRuleOfThree}
          onUpdateTitle={handleUpdateRuleOfThreeTitle}
        />

        <OverbookingGuardrail blocks={schedule.blocks} />
      </div>

      {/* Batched Time Blocks List (Requirement 3 & 4) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Scheduled Time Blocks & Task Batches
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Group similar micro-tasks into single time blocks instead of fragmented scheduling.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenAddBlock}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Block</span>
          </button>
        </div>

        {sortedBlocks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center transition-colors">
            <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No Time Blocks for this Day
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
              Apply a School Day or Work-Only Day template to populate this day instantly, or add custom flexible blocks.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={onOpenApplyTemplate}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                Apply Reusable Template
              </button>
              <button
                type="button"
                onClick={onOpenAddBlock}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                + Add Custom Block
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedBlocks.map(block => (
              <BatchedTimeBlockCard
                key={block.id}
                block={block}
                onUpdateBlock={handleUpdateBlock}
                onDeleteBlock={handleDeleteBlock}
                onEditBlockDetails={onEditBlock}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
