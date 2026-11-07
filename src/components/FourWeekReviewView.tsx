import React, { useState } from 'react';
import { DaySchedule, ScheduleTemplate } from '../types';
import {
  get4CalendarWeeks,
  formatShortDate,
  parseISODate,
  formatHoursAndMinutes,
  timeToMinutes
} from '../utils/dateUtils';
import {
  Calendar,
  ChevronRight,
  Check,
  Bookmark
} from 'lucide-react';

interface FourWeekReviewViewProps {
  schedules: Record<string, DaySchedule>;
  templates: ScheduleTemplate[];
  onSelectDay: (dateISO: string) => void;
  onOpenApplyTemplate: () => void;
}

export const FourWeekReviewView: React.FC<FourWeekReviewViewProps> = ({
  schedules,
  templates,
  onSelectDay,
  onOpenApplyTemplate
}) => {
  const weeks = get4CalendarWeeks();
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0); // 0 = all or 1,2,3,4

  // Aggregate stats across all 4 weeks
  let totalMITCount = 0;
  let completedMITCount = 0;
  let totalSubtaskCount = 0;
  let completedSubtaskCount = 0;
  let totalSchoolHours = 0;
  let totalWorkHours = 0;
  let totalBufferHours = 0;
  let totalOverbookedDays = 0;

  // Process data per week
  const weekStats = weeks.map((week, idx) => {
    let wMIT = 0;
    let wMITCompleted = 0;
    let wTasks = 0;
    let wTasksCompleted = 0;
    let wSchoolMin = 0;
    let wWorkMin = 0;
    let wBufferMin = 0;
    let wOverbooked = 0;

    const daysData = week.days.map(dateISO => {
      const schedule = schedules[dateISO];
      const mits = schedule?.ruleOfThree || [];
      const blocks = schedule?.blocks || [];

      const mitsDone = mits.filter(m => m.completed).length;
      let daySubtasks = 0;
      let daySubtasksDone = 0;
      let dayMin = 0;
      let dayFlexMin = 0;

      blocks.forEach(b => {
        const start = timeToMinutes(b.startTime);
        let end = timeToMinutes(b.endTime);
        if (end < start) end += 24 * 60;
        const dur = Math.max(0, end - start);
        dayMin += dur;

        if (b.category === 'school') wSchoolMin += dur;
        if (b.category === 'work') wWorkMin += dur;
        if (b.category === 'buffer') wBufferMin += dur;
        if (b.isFlexible) dayFlexMin += dur;

        daySubtasks += b.subtasks.length;
        daySubtasksDone += b.subtasks.filter(t => t.completed).length;
      });

      const dayHardHours = (dayMin - dayFlexMin) / 60;
      const isOverbooked = dayHardHours > 8.0 || dayMin / 60 > 11.0;
      if (isOverbooked) wOverbooked++;

      wMIT += mits.length;
      wMITCompleted += mitsDone;
      wTasks += daySubtasks;
      wTasksCompleted += daySubtasksDone;

      return {
        dateISO,
        schedule,
        mits,
        mitsDone,
        daySubtasks,
        daySubtasksDone,
        dayHours: dayMin / 60,
        isOverbooked,
        templateName: schedule?.templateName
      };
    });

    const wTotalItems = wMIT + wTasks;
    const wDoneItems = wMITCompleted + wTasksCompleted;
    const wRate = wTotalItems > 0 ? Math.round((wDoneItems / wTotalItems) * 100) : 0;

    totalMITCount += wMIT;
    completedMITCount += wMITCompleted;
    totalSubtaskCount += wTasks;
    completedSubtaskCount += wTasksCompleted;
    totalSchoolHours += wSchoolMin / 60;
    totalWorkHours += wWorkMin / 60;
    totalBufferHours += wBufferMin / 60;
    totalOverbookedDays += wOverbooked;

    return {
      ...week,
      idx,
      wMIT,
      wMITCompleted,
      wTasks,
      wTasksCompleted,
      rate: wRate,
      schoolHours: wSchoolMin / 60,
      workHours: wWorkMin / 60,
      bufferHours: wBufferMin / 60,
      overbookedDays: wOverbooked,
      daysData
    };
  });

  const grandTotalItems = totalMITCount + totalSubtaskCount;
  const grandDoneItems = completedMITCount + completedSubtaskCount;
  const overallRate = grandTotalItems > 0 ? Math.round((grandDoneItems / grandTotalItems) * 100) : 0;

  const displayedWeeks = selectedWeekIndex === 0
    ? weekStats
    : weekStats.filter((_, idx) => idx + 1 === selectedWeekIndex);

  return (
    <div className="space-y-6">
      {/* 4-Week Horizon Overview Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                4-Calendar-Week Review
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md font-semibold">
                4 Weeks Horizon
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Track task completion velocity, school vs work balance, and schedule stability across the upcoming 28 days.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenApplyTemplate}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg transition-colors cursor-pointer self-start sm:self-auto shadow-xs whitespace-nowrap"
          >
            Bulk Apply Templates
          </button>
        </div>

        {/* High-Level Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-lg">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">4-Week Completion Rate</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                {overallRate}%
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                {grandDoneItems}/{grandTotalItems} done
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-lg">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Rule of 3 (MITs) Tracked</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                {completedMITCount}/{totalMITCount}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {totalMITCount > 0 ? Math.round((completedMITCount / totalMITCount) * 100) : 0}%
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-lg">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">School vs Work Hours</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm font-bold font-mono text-blue-700 dark:text-blue-400 tabular-nums">
                {formatHoursAndMinutes(totalSchoolHours)}
              </span>
              <span className="text-xs text-slate-300 dark:text-slate-600">/</span>
              <span className="text-sm font-bold font-mono text-amber-700 dark:text-amber-400 tabular-nums">
                {formatHoursAndMinutes(totalWorkHours)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
              School / Work commitment
            </span>
          </div>

          <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-lg">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Overbooking Alerts</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-2xl font-bold font-mono tabular-nums ${
                  totalOverbookedDays > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {totalOverbookedDays}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {totalOverbookedDays === 0 ? 'Optimal capacity' : 'days need buffer'}
              </span>
            </div>
          </div>
        </div>

        {/* Filter / Week Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setSelectedWeekIndex(0)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              selectedWeekIndex === 0
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All 4 Weeks View
          </button>
          {weeks.map((w, idx) => (
            <button
              key={w.weekIndex}
              type="button"
              onClick={() => setSelectedWeekIndex(idx + 1)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                selectedWeekIndex === idx + 1
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {w.shortLabel} {idx === 0 && '(Current)'}
            </button>
          ))}
        </div>
      </div>

      {/* Week Sections */}
      <div className="space-y-6">
        {displayedWeeks.map((week) => (
          <div
            key={week.weekIndex}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors"
          >
            {/* Week Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {week.label}
                  </h2>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {formatShortDate(week.startDate)} – {formatShortDate(week.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>MITs: {week.wMITCompleted}/{week.wMIT}</span>
                  <span aria-hidden="true">·</span>
                  <span>Batched Tasks: {week.wTasksCompleted}/{week.wTasks}</span>
                  <span aria-hidden="true">·</span>
                  <span>School: {formatHoursAndMinutes(week.schoolHours)}</span>
                  <span aria-hidden="true">·</span>
                  <span>Work: {formatHoursAndMinutes(week.workHours)}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3 self-start sm:self-auto min-w-[140px]">
                <div className="w-28 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div
                    className="h-full bg-slate-900 dark:bg-slate-100 rounded-full transition-all duration-300"
                    style={{ width: `${week.rate}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {week.rate}%
                </span>
              </div>
            </div>

            {/* 7-Day Scannable Strip */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mt-4">
              {week.daysData.map((day) => {
                const dObj = parseISODate(day.dateISO);
                const dayName = dObj.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = dObj.getDate();

                return (
                  <div
                    key={day.dateISO}
                    onClick={() => onSelectDay(day.dateISO)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer group flex flex-col justify-between min-h-[160px] ${
                      day.isOverbooked
                        ? 'border-amber-300 dark:border-amber-800/70 bg-amber-50/20 dark:bg-amber-950/20 hover:border-amber-400'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-2xs'
                    }`}
                  >
                    <div>
                      {/* Day Header */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {dayName} {dayNum}
                        </span>
                        {day.dayHours > 0 && (
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                            {formatHoursAndMinutes(day.dayHours)}
                          </span>
                        )}
                      </div>

                      {/* Applied Template Tag */}
                      <div className="mb-2">
                        {day.templateName ? (
                          <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 line-clamp-1">
                            {day.templateName.replace(' Template', '')}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                            No template
                          </span>
                        )}
                      </div>

                      {/* Rule of 3 Mini List */}
                      <div className="space-y-1">
                        {day.mits.length === 0 ? (
                          <span className="text-[10px] text-slate-300 dark:text-slate-600 italic block">
                            No MITs logged
                          </span>
                        ) : (
                          day.mits.map((m) => (
                            <div
                              key={m.id}
                              className="flex items-start gap-1 text-[11px] leading-tight"
                            >
                              <span
                                className={`w-2.5 h-2.5 mt-0.5 rounded-xs flex items-center justify-center shrink-0 ${
                                  m.completed
                                    ? 'bg-emerald-600 text-white'
                                    : 'border border-slate-300 dark:border-slate-600'
                                }`}
                              >
                                {m.completed && <Check className="w-2 h-2" />}
                              </span>
                              <span
                                className={`line-clamp-1 ${
                                  m.completed
                                    ? 'line-through text-slate-400 dark:text-slate-500'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {m.title}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Bottom Day Footer */}
                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 dark:text-slate-400 font-mono">
                        {day.mitsDone}/{day.mits.length} MITs
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-100 font-medium inline-flex items-center gap-0.5">
                        Open <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
