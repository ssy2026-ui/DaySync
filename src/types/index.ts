export type CategoryType = 'school' | 'work' | 'personal' | 'buffer';

export interface GroupedSubtask {
  id: string;
  title: string;
  completed: boolean;
  category: 'school' | 'work';
}

export interface ScheduledBlock {
  id: string;
  title: string;
  startTime: string; // "09:00"
  endTime: string;   // "11:30"
  category: CategoryType;
  isFlexible: boolean; // Flexible time block to absorb schedule drift
  subtasks: GroupedSubtask[]; // Grouped similar tasks in this block
}

export interface RuleOfThreeItem {
  id: string;
  title: string;
  category: 'school' | 'work';
  completed: boolean;
  notes?: string;
  assignedBlockId?: string;
}

export interface TemplateBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  category: CategoryType;
  isFlexible: boolean;
  defaultSubtaskTitles: string[];
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  type: 'school' | 'work' | 'hybrid' | 'custom';
  blocks: TemplateBlock[];
}

export interface DaySchedule {
  date: string; // ISO format "YYYY-MM-DD"
  templateId?: string;
  templateName?: string;
  ruleOfThree: RuleOfThreeItem[]; // Max 3 items
  blocks: ScheduledBlock[];
  dayNotes?: string;
}

export interface WeekProgressSummary {
  weekNumber: number; // 1 to 4
  weekStartDate: string; // YYYY-MM-DD
  weekEndDate: string;   // YYYY-MM-DD
  label: string;
  days: {
    date: string;
    dayName: string;
    dayNumber: number;
    hasTemplate: boolean;
    templateName?: string;
    totalRuleOfThree: number;
    completedRuleOfThree: number;
    totalSubtasks: number;
    completedSubtasks: number;
    totalScheduledHours: number;
    isOverbooked: boolean;
  }[];
  totalRuleOfThree: number;
  completedRuleOfThree: number;
  totalSubtasks: number;
  completedSubtasks: number;
  totalScheduledHours: number;
  schoolHours: number;
  workHours: number;
  completionRate: number; // 0 to 100
}
