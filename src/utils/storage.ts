import { DaySchedule, ScheduleTemplate, ScheduledBlock } from '../types';

export const STORAGE_KEY_TEMPLATES = 'tempo_schedule_templates_v1';
export const STORAGE_KEY_SCHEDULES = 'tempo_day_schedules_v1';
export const STORAGE_KEY_GUEST_SCHEDULES = 'tempo_guest_schedules_v1';
export const STORAGE_KEY_GUEST_TEMPLATES = 'tempo_guest_templates_v1';

export const DEFAULT_TEMPLATES: ScheduleTemplate[] = [
  {
    id: 'tpl-school-day',
    name: 'School Day Template',
    description: 'Structured layout for lecture blocks, study lab, and flexible coursework catch-up.',
    type: 'school',
    blocks: [
      {
        id: 'sb-1',
        title: 'Morning Lectures & Coursework',
        startTime: '08:30',
        endTime: '11:30',
        category: 'school',
        isFlexible: false,
        defaultSubtaskTitles: []
      },
      {
        id: 'sb-2',
        title: 'Midday Lunch & Transition Buffer',
        startTime: '11:30',
        endTime: '13:00',
        category: 'buffer',
        isFlexible: true,
        defaultSubtaskTitles: []
      },
      {
        id: 'sb-3',
        title: 'Study Lab & Problem Sets',
        startTime: '13:00',
        endTime: '16:00',
        category: 'school',
        isFlexible: false,
        defaultSubtaskTitles: []
      },
      {
        id: 'sb-4',
        title: 'Flexible Course Review & Prep',
        startTime: '16:30',
        endTime: '18:00',
        category: 'school',
        isFlexible: true,
        defaultSubtaskTitles: []
      }
    ]
  },
  {
    id: 'tpl-work-day',
    name: 'Work-Only Day Template',
    description: 'Dedicated focus sprints, batched communications, and end-of-day wrap-up.',
    type: 'work',
    blocks: [
      {
        id: 'wb-1',
        title: 'Deep Focus Work Sprint',
        startTime: '09:00',
        endTime: '12:00',
        category: 'work',
        isFlexible: false,
        defaultSubtaskTitles: []
      },
      {
        id: 'wb-2',
        title: 'Midday Rest & Buffer',
        startTime: '12:00',
        endTime: '13:00',
        category: 'buffer',
        isFlexible: true,
        defaultSubtaskTitles: []
      },
      {
        id: 'wb-3',
        title: 'Batch Communications & Meetings',
        startTime: '13:00',
        endTime: '15:30',
        category: 'work',
        isFlexible: false,
        defaultSubtaskTitles: []
      },
      {
        id: 'wb-4',
        title: 'Flexible Project Execution & Wrap-Up',
        startTime: '16:00',
        endTime: '17:30',
        category: 'work',
        isFlexible: true,
        defaultSubtaskTitles: []
      }
    ]
  },
  {
    id: 'tpl-hybrid-day',
    name: 'Hybrid School & Work Day',
    description: 'Balanced arrangement coordinating morning classes with afternoon work commitments.',
    type: 'hybrid',
    blocks: [
      {
        id: 'hb-1',
        title: 'Morning Class & Academic Focus',
        startTime: '08:30',
        endTime: '11:30',
        category: 'school',
        isFlexible: false,
        defaultSubtaskTitles: []
      },
      {
        id: 'hb-2',
        title: 'Buffer & Commute Window',
        startTime: '11:30',
        endTime: '12:45',
        category: 'buffer',
        isFlexible: true,
        defaultSubtaskTitles: []
      },
      {
        id: 'hb-3',
        title: 'Afternoon Work Shift & Deliverables',
        startTime: '13:00',
        endTime: '17:00',
        category: 'work',
        isFlexible: false,
        defaultSubtaskTitles: []
      },
      {
        id: 'hb-4',
        title: 'Decompression & Light Study Buffer',
        startTime: '18:00',
        endTime: '19:30',
        category: 'buffer',
        isFlexible: true,
        defaultSubtaskTitles: []
      }
    ]
  }
];

export function getStoredTemplates(): ScheduleTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEMPLATES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES));
      return DEFAULT_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TEMPLATES;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

export function saveStoredTemplates(templates: ScheduleTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
  } catch (err) {
    console.error('Failed to save templates to localStorage', err);
  }
}

export function getStoredSchedules(): Record<string, DaySchedule> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCHEDULES);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveStoredSchedules(schedules: Record<string, DaySchedule>): void {
  try {
    localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(schedules));
  } catch (err) {
    console.error('Failed to save schedules to localStorage', err);
  }
}

// User-scoped local storage helpers (keeps each account's cache separate and private)
export function getUserStoredSchedules(userId: string): Record<string, DaySchedule> {
  try {
    const key = `tempo_user_schedules_${userId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveUserStoredSchedules(
  userId: string,
  schedules: Record<string, DaySchedule>
): void {
  try {
    const key = `tempo_user_schedules_${userId}`;
    localStorage.setItem(key, JSON.stringify(schedules));
  } catch (err) {
    console.error('Failed to cache user schedules', err);
  }
}

export function getUserStoredTemplates(userId: string): ScheduleTemplate[] {
  try {
    const key = `tempo_user_templates_${userId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return DEFAULT_TEMPLATES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TEMPLATES;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

export function saveUserStoredTemplates(
  userId: string,
  templates: ScheduleTemplate[]
): void {
  try {
    const key = `tempo_user_templates_${userId}`;
    localStorage.setItem(key, JSON.stringify(templates));
  } catch (err) {
    console.error('Failed to cache user templates', err);
  }
}

// Read any pre-existing local schedules created before Firebase or in guest mode
export function getPreExistingLocalSchedules(): Record<string, DaySchedule> {
  try {
    const primary = getStoredSchedules();
    const guestRaw = localStorage.getItem(STORAGE_KEY_GUEST_SCHEDULES);
    const guest = guestRaw ? JSON.parse(guestRaw) : {};
    return { ...primary, ...guest };
  } catch {
    return {};
  }
}

// Deep recovery: scans legacy keys and all user-scoped caches to ensure zero data is lost
export function getAllLocalSchedules(): Record<string, DaySchedule> {
  const result: Record<string, DaySchedule> = {};
  try {
    // 1. Primary legacy storage from pre-Firebase
    const primary = getStoredSchedules();
    if (primary && typeof primary === 'object') {
      Object.assign(result, primary);
    }

    // 2. Guest storage
    const guestRaw = localStorage.getItem(STORAGE_KEY_GUEST_SCHEDULES);
    if (guestRaw) {
      try {
        const parsedGuest = JSON.parse(guestRaw);
        if (parsedGuest && typeof parsedGuest === 'object') {
          Object.assign(result, parsedGuest);
        }
      } catch (e) {
        console.error('Failed to parse guest schedules:', e);
      }
    }

    // 3. Scan any tempo_user_schedules_ keys in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tempo_user_schedules_')) {
        try {
          const val = localStorage.getItem(key);
          if (val) {
            const parsed = JSON.parse(val);
            if (parsed && typeof parsed === 'object') {
              for (const [date, sched] of Object.entries(parsed)) {
                if (sched && typeof sched === 'object') {
                  const currentBlocks = (result[date]?.blocks || []).length;
                  const newBlocks = ((sched as any).blocks || []).length;
                  const currentRule3 = (result[date]?.ruleOfThree || []).length;
                  const newRule3 = ((sched as any).ruleOfThree || []).length;
                  // If not present or this version has more data, keep it
                  if (!result[date] || newBlocks > currentBlocks || newRule3 > currentRule3) {
                    result[date] = sched as DaySchedule;
                  }
                }
              }
            }
          }
        } catch {
          // Ignore individual key parse errors
        }
      }
    }
  } catch (err) {
    console.error('Failed to read all local schedules', err);
  }
  return result;
}

export function clearGuestStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_GUEST_SCHEDULES);
    localStorage.removeItem(STORAGE_KEY_GUEST_TEMPLATES);
  } catch (err) {
    console.error('Failed to clear guest storage', err);
  }
}

export function getPreExistingLocalTemplates(): ScheduleTemplate[] {
  try {
    const primary = getStoredTemplates();
    return Array.isArray(primary) && primary.length > 0 ? primary : DEFAULT_TEMPLATES;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

export function applyTemplateToSchedule(day: DaySchedule, template: ScheduleTemplate): DaySchedule {
  const newBlocks: ScheduledBlock[] = template.blocks.map(tb => ({
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

  return {
    ...day,
    templateId: template.id,
    templateName: template.name,
    blocks: newBlocks
  };
}
