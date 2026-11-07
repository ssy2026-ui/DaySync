import React, { useState } from 'react';
import { ScheduledBlock, CategoryType } from '../types';
import { X, Clock } from 'lucide-react';
import { calculateDurationHours, formatHoursAndMinutes } from '../utils/dateUtils';

interface BlockEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (block: Omit<ScheduledBlock, 'id'>, existingId?: string) => void;
  editingBlock?: ScheduledBlock | null;
}

export const BlockEditorModal: React.FC<BlockEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingBlock
}) => {
  const [title, setTitle] = useState(editingBlock?.title || '');
  const [startTime, setStartTime] = useState(editingBlock?.startTime || '09:00');
  const [endTime, setEndTime] = useState(editingBlock?.endTime || '11:00');
  const [category, setCategory] = useState<CategoryType>(editingBlock?.category || 'school');
  const [isFlexible, setIsFlexible] = useState<boolean>(editingBlock?.isFlexible ?? false);

  React.useEffect(() => {
    if (editingBlock) {
      setTitle(editingBlock.title);
      setStartTime(editingBlock.startTime);
      setEndTime(editingBlock.endTime);
      setCategory(editingBlock.category);
      setIsFlexible(editingBlock.isFlexible);
    } else {
      setTitle('');
      setStartTime('09:00');
      setEndTime('11:00');
      setCategory('school');
      setIsFlexible(false);
    }
  }, [editingBlock, isOpen]);

  if (!isOpen) return null;

  const durationHours = calculateDurationHours(startTime, endTime);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(
      {
        title: title.trim(),
        startTime,
        endTime,
        category,
        isFlexible,
        subtasks: editingBlock?.subtasks || []
      },
      editingBlock?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {editingBlock ? 'Edit Scheduled Block' : 'Create Scheduled Block'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Set dedicated time for school, work, or buffer periods.
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Block Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Morning Lectures & Problem Sets"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Time
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-lg flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Calculated Duration:
            </span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
              {formatHoursAndMinutes(durationHours)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Responsibility Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory('school')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                  category === 'school'
                    ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-600 text-blue-800 dark:text-blue-300 font-semibold shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                School
              </button>
              <button
                type="button"
                onClick={() => setCategory('work')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                  category === 'work'
                    ? 'bg-amber-50 dark:bg-amber-900/40 border-amber-600 text-amber-800 dark:text-amber-300 font-semibold shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Work
              </button>
              <button
                type="button"
                onClick={() => setCategory('buffer')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                  category === 'buffer'
                    ? 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-600 text-emerald-800 dark:text-emerald-300 font-semibold shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Buffer / Rest
              </button>
            </div>
          </div>

          {/* Flexible Block Option */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isFlexible}
                onChange={e => setIsFlexible(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-600"
              />
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  Designate as Flexible Time Block
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                  Protects against overbooking. Flexible blocks can drift or shrink without causing panic.
                </span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white disabled:opacity-40 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              {editingBlock ? 'Save Changes' : 'Add Block'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
