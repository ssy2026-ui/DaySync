import React, { useState, useEffect } from 'react';
import { ScheduleTemplate } from '../types';
import { X, Calendar, CheckSquare, Layers, Clock, ArrowRight, Info } from 'lucide-react';
import { formatTime12h, calculateDurationHours, formatHoursAndMinutes, formatShortDate } from '../utils/dateUtils';

interface ApplyTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ScheduleTemplate[];
  currentDateISO: string;
  initialTemplateId?: string;
  onApplySingleDay: (templateId: string, targetDateISO: string) => void;
  onBulkApplyToWeekdays: (templateId: string, weekdayIndices: number[], weekCount: number) => void;
}

export const ApplyTemplateModal: React.FC<ApplyTemplateModalProps> = ({
  isOpen,
  onClose,
  templates,
  currentDateISO,
  initialTemplateId,
  onApplySingleDay,
  onBulkApplyToWeekdays
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialTemplateId || templates[0]?.id || ''
  );
  const [applyMode, setApplyMode] = useState<'single' | 'bulk'>('single');
  const [targetDateISO, setTargetDateISO] = useState<string>(currentDateISO);
  // Weekday selection: 0 = Mon, 1 = Tue, 2 = Wed, 3 = Thu, 4 = Fri, 5 = Sat, 6 = Sun
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 2, 4]); // default Mon, Wed, Fri for school
  const [weekHorizon, setWeekHorizon] = useState<number>(4); // apply across 1 to 4 weeks

  useEffect(() => {
    if (initialTemplateId) {
      setSelectedTemplateId(initialTemplateId);
      const t = templates.find(item => item.id === initialTemplateId);
      if (t?.type === 'school') setSelectedDays([0, 2, 4]);
      if (t?.type === 'work') setSelectedDays([1, 3]);
    } else if (templates[0]?.id) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [initialTemplateId, templates, isOpen]);

  if (!isOpen) return null;

  const currentTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  const weekdayLabels = [
    { index: 0, label: 'Mon' },
    { index: 1, label: 'Tue' },
    { index: 2, label: 'Wed' },
    { index: 3, label: 'Thu' },
    { index: 4, label: 'Fri' },
    { index: 5, label: 'Sat' },
    { index: 6, label: 'Sun' }
  ];

  const toggleWeekday = (index: number) => {
    if (selectedDays.includes(index)) {
      setSelectedDays(selectedDays.filter(i => i !== index));
    } else {
      setSelectedDays([...selectedDays, index].sort((a, b) => a - b));
    }
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTemplate) return;

    if (applyMode === 'single') {
      onApplySingleDay(currentTemplate.id, targetDateISO);
    } else {
      if (selectedDays.length === 0) return;
      onBulkApplyToWeekdays(currentTemplate.id, selectedDays, weekHorizon);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Apply Schedule Template
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Instantly deploy your pre-configured school or work day blocks without rebuilding from scratch.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleApply} className="p-6 space-y-5">
          {/* 1. Choose Template */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              1. Select Template to Apply
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {templates.map(tpl => {
                const isSelected = tpl.id === selectedTemplateId;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(tpl.id);
                      if (tpl.type === 'school') setSelectedDays([0, 2, 4]); // Mon, Wed, Fri
                      if (tpl.type === 'work') setSelectedDays([1, 3]); // Tue, Thu
                    }}
                    className={`p-3.5 text-left rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 dark:border-slate-300 bg-slate-900 dark:bg-slate-800 text-white shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                        {tpl.name}
                      </span>
                    </div>
                    <p className={`text-[11px] line-clamp-2 leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                      {tpl.description}
                    </p>
                    <div className={`mt-2 text-[10px] font-mono ${isSelected ? 'text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                      {tpl.blocks.length} time blocks
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Template Preview */}
          {currentTemplate && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Blocks in "{currentTemplate.name}":
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {currentTemplate.blocks.map(b => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between text-xs py-1 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                        {formatTime12h(b.startTime)} – {formatTime12h(b.endTime)}
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{b.title}</span>
                    </div>
                    <span className="text-[10px] capitalize text-slate-500 dark:text-slate-400">
                      {b.category} {b.isFlexible && '· Flexible'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Choose Application Scope: Single Day vs Recurring Weekdays */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              2. Choose Target Scope
            </label>
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setApplyMode('single')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  applyMode === 'single'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Apply to Single Date
              </button>
              <button
                type="button"
                onClick={() => setApplyMode('bulk')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  applyMode === 'bulk'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Recurring Weekdays (Up to 4 Calendar Weeks)
              </button>
            </div>
          </div>

          {applyMode === 'single' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Date
              </label>
              <input
                type="date"
                value={targetDateISO}
                onChange={e => setTargetDateISO(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden font-mono"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                Selected: {formatShortDate(targetDateISO)}
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Recurring Weekdays
                </label>
                <div className="flex items-center gap-1.5">
                  {weekdayLabels.map(({ index, label }) => {
                    const isChecked = selectedDays.includes(index);
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => toggleWeekday(index)}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900 font-semibold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Horizon Duration
                </label>
                <select
                  value={weekHorizon}
                  onChange={e => setWeekHorizon(Number(e.target.value))}
                  className="w-full text-sm px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden font-medium"
                >
                  <option value={1}>Current Week Only (1 calendar week)</option>
                  <option value={2}>Next 2 Calendar Weeks</option>
                  <option value={3}>Next 3 Calendar Weeks</option>
                  <option value={4}>Full 4 Calendar Weeks Horizon (Recommended)</option>
                </select>
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!currentTemplate || (applyMode === 'bulk' && selectedDays.length === 0)}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white disabled:opacity-40 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <span>Deploy Template</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
