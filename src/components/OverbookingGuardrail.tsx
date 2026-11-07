import React from 'react';
import { ScheduledBlock } from '../types';
import { calculateDurationHours, formatHoursAndMinutes, timeToMinutes, formatTime12h } from '../utils/dateUtils';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface OverbookingGuardrailProps {
  blocks: ScheduledBlock[];
}

export const OverbookingGuardrail: React.FC<OverbookingGuardrailProps> = ({ blocks }) => {
  // Active waking day standard: 07:00 to 22:00 (15 hours = 900 minutes)
  const DAY_START_MIN = 7 * 60; // 07:00
  const DAY_END_MIN = 22 * 60;  // 22:00
  const TOTAL_DAY_MIN = DAY_END_MIN - DAY_START_MIN; // 900 min = 15h

  let totalScheduledMin = 0;
  let schoolMin = 0;
  let workMin = 0;
  let bufferMin = 0;
  let flexibleMin = 0;

  blocks.forEach(b => {
    const start = timeToMinutes(b.startTime);
    let end = timeToMinutes(b.endTime);
    if (end < start) end += 24 * 60;
    const dur = Math.max(0, end - start);

    totalScheduledMin += dur;

    if (b.category === 'school') schoolMin += dur;
    if (b.category === 'work') workMin += dur;
    if (b.category === 'buffer') bufferMin += dur;
    if (b.isFlexible) flexibleMin += dur;
  });

  const totalScheduledHours = totalScheduledMin / 60;
  const hardCommitmentMin = totalScheduledMin - flexibleMin;
  const hardCommitmentHours = hardCommitmentMin / 60;
  const freeMarginHours = Math.max(0, (TOTAL_DAY_MIN - totalScheduledMin) / 60);

  // Overbooking criteria
  const isOverbooked = hardCommitmentHours > 8.0 || totalScheduledHours > 11.0;
  const isHeavyLoad = !isOverbooked && (hardCommitmentHours > 6.0 || totalScheduledHours > 8.5);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs transition-colors">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Day Capacity & Overbooking Guard
            </h2>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                isOverbooked
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                  : isHeavyLoad
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              {isOverbooked ? 'Overbooked Day' : isHeavyLoad ? 'Heavy Schedule' : 'Balanced Capacity'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time workload calculation to protect flexible buffers and prevent daily burnout.
          </p>
        </div>

        {/* Primary summary figures */}
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-slate-400 dark:text-slate-500 block">Total Scheduled</span>
            <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {formatHoursAndMinutes(totalScheduledHours)}
            </span>
          </div>
          <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
            <span className="text-slate-400 dark:text-slate-500 block">Flexible Buffers</span>
            <span className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {formatHoursAndMinutes(flexibleMin / 60)}
            </span>
          </div>
          <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
            <span className="text-slate-400 dark:text-slate-500 block">Open Margin</span>
            <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
              {formatHoursAndMinutes(freeMarginHours)}
            </span>
          </div>
        </div>
      </div>

      {/* Advisory Message */}
      <div className="my-4">
        {isOverbooked ? (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg flex items-start gap-3 text-xs text-rose-900 dark:text-rose-200">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Overbooking Alert: {formatHoursAndMinutes(hardCommitmentHours)} of non-flexible time committed.</p>
              <p className="text-rose-700 dark:text-rose-300 mt-0.5">
                Days with over 8 hours of rigid commitments have higher failure rates. Convert fixed blocks to Flexible Time Blocks or reallocate tasks.
              </p>
            </div>
          </div>
        ) : isHeavyLoad ? (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Tight Schedule: Moderate workload capacity reached.</p>
              <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                You have {formatHoursAndMinutes(flexibleMin / 60)} in flexible buffers. Protect those buffers against unexpected meetings or assignment run-time.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-lg flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Healthy Schedule Balance: Buffer headroom preserved.</p>
              <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
                You have {formatHoursAndMinutes(freeMarginHours)} open breathing room and {formatHoursAndMinutes(flexibleMin / 60)} flexible buffer space.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Visual Timeline Bar (07:00 to 22:00) */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-mono mb-1.5">
          <span>07:00 AM</span>
          <span>12:00 PM</span>
          <span>05:00 PM</span>
          <span>10:00 PM</span>
        </div>

        <div className="relative h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden flex border border-slate-200 dark:border-slate-700">
          {blocks.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 italic">
              No blocks scheduled yet
            </div>
          ) : (
            blocks.map((block) => {
              const start = Math.max(DAY_START_MIN, timeToMinutes(block.startTime));
              const end = Math.min(DAY_END_MIN, timeToMinutes(block.endTime));
              if (end <= start) return null;

              const leftPercent = ((start - DAY_START_MIN) / TOTAL_DAY_MIN) * 100;
              const widthPercent = ((end - start) / TOTAL_DAY_MIN) * 100;

              let bgClass = 'bg-slate-400 dark:bg-slate-600';
              if (block.category === 'school') bgClass = 'bg-blue-600 dark:bg-blue-500';
              if (block.category === 'work') bgClass = 'bg-amber-600 dark:bg-amber-500';
              if (block.category === 'buffer') bgClass = 'bg-emerald-500 dark:bg-emerald-600';

              if (block.isFlexible) {
                bgClass += ' opacity-85 border-t-2 border-emerald-300 dark:border-emerald-400';
              }

              return (
                <div
                  key={block.id}
                  style={{
                    position: 'absolute',
                    left: `${Math.max(0, leftPercent)}%`,
                    width: `${Math.min(100 - leftPercent, widthPercent)}%`,
                    height: '100%'
                  }}
                  className={`${bgClass} transition-all hover:brightness-110 cursor-pointer flex items-center justify-center px-1 overflow-hidden`}
                  title={`${block.title} (${formatTime12h(block.startTime)} - ${formatTime12h(block.endTime)}) [${block.isFlexible ? 'Flexible' : 'Fixed'}]`}
                >
                  <span className="text-[10px] text-white font-medium truncate pointer-events-none select-none">
                    {block.title}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 dark:bg-blue-500" aria-hidden="true" />
            <span>School ({formatHoursAndMinutes(schoolMin / 60)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-600 dark:bg-amber-500" aria-hidden="true" />
            <span>Work ({formatHoursAndMinutes(workMin / 60)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 dark:bg-emerald-600" aria-hidden="true" />
            <span>Buffer / Flexible ({formatHoursAndMinutes(flexibleMin / 60)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" aria-hidden="true" />
            <span>Open Room ({formatHoursAndMinutes(freeMarginHours)})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
