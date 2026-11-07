import React, { useState } from 'react';
import { RuleOfThreeItem } from '../types';
import { Check, Plus, Trash2, Award } from 'lucide-react';

interface RuleOfThreeTrackerProps {
  items: RuleOfThreeItem[];
  onAddItem: (title: string, category: 'school' | 'work') => void;
  onToggleItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onUpdateTitle: (id: string, newTitle: string) => void;
}

export const RuleOfThreeTracker: React.FC<RuleOfThreeTrackerProps> = ({
  items,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onUpdateTitle
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [category, setCategory] = useState<'school' | 'work'>('school');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const completedCount = items.filter(i => i.completed).length;
  const isFull = items.length >= 3;

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isFull) return;
    onAddItem(newTitle.trim(), category);
    setNewTitle('');
    setIsAdding(false);
  };

  const handleStartEdit = (item: RuleOfThreeItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim()) {
      onUpdateTitle(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Daily Rule of 3 (MITs)
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {completedCount}/3 completed
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pick exactly 3 high-impact outcomes for today. Do not expand primary scope until all three are finished.
          </p>
        </div>

        {!isFull && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Priority ({3 - items.length} remaining)</span>
          </button>
        )}
      </div>

      {/* Slots List (1, 2, 3) */}
      <div className="mt-4 space-y-3">
        {[0, 1, 2].map(slotIndex => {
          const item = items[slotIndex];

          if (!item) {
            return (
              <div
                key={`empty-slot-${slotIndex}`}
                onClick={() => {
                  if (!isAdding) setIsAdding(true);
                }}
                className="flex items-center justify-between p-3.5 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-slate-400 group"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-mono text-slate-400 dark:text-slate-500">
                    {slotIndex + 1}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200">
                    Priority #{slotIndex + 1} unassigned · Click to set daily win
                  </span>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 font-medium">
                  + Assign
                </span>
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className={`flex items-start justify-between gap-3 p-3.5 border rounded-lg transition-all ${
                item.completed
                  ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => onToggleItem(item.id)}
                  className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
                    item.completed
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 dark:border-slate-600 hover:border-slate-500 bg-white dark:bg-slate-800'
                  }`}
                  aria-label={item.completed ? 'Mark uncompleted' : 'Mark completed'}
                >
                  {item.completed && <Check className="w-3.5 h-3.5" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 text-xs">
                    <span className="font-mono text-slate-500 dark:text-slate-400 font-medium">
                      Priority #{slotIndex + 1}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                    <span
                      className={`capitalize font-medium ${
                        item.category === 'school'
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {item.category}
                    </span>
                    {item.completed && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Completed</span>
                      </>
                    )}
                  </div>

                  {editingId === item.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit(item.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="flex-1 text-sm px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(item.id)}
                        className="text-xs px-2.5 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-white rounded font-medium cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <p
                      onClick={() => handleStartEdit(item)}
                      className={`text-sm cursor-text leading-snug break-words ${
                        item.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-slate-100 font-medium hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                      title="Click to edit task"
                    >
                      {item.title}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Remove from Rule of 3"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Item Form Drawer */}
      {isAdding && !isFull && (
        <form onSubmit={handleSubmitNew} className="mt-4 p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              New Rule of 3 Priority (#{items.length + 1})
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="e.g. Finish Biology Lab report analysis or Finalize Q4 client presentation"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              autoFocus
              className="w-full text-sm px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden"
            />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 bg-slate-200/60 dark:bg-slate-700/60 rounded-lg">
                <button
                  type="button"
                  onClick={() => setCategory('school')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    category === 'school'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  School Priority
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('work')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    category === 'work'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Work Priority
                </button>
              </div>

              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
              >
                Save Priority
              </button>
            </div>
          </div>
        </form>
      )}

      {/* All Completed Banner */}
      {isFull && completedCount === 3 && (
        <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200 text-xs font-medium">
          <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Rule of 3 Achieved! All 3 primary outcomes completed for today.</span>
        </div>
      )}
    </div>
  );
};
