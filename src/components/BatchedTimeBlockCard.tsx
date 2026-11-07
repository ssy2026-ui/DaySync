import React, { useState } from 'react';
import { ScheduledBlock, GroupedSubtask } from '../types';
import { calculateDurationHours, formatHoursAndMinutes, formatTime12h } from '../utils/dateUtils';
import {
  Check,
  Plus,
  Trash2,
  Layers,
  ToggleLeft,
  ToggleRight,
  Edit2
} from 'lucide-react';

interface BatchedTimeBlockCardProps {
  block: ScheduledBlock;
  onUpdateBlock: (updated: ScheduledBlock) => void;
  onDeleteBlock: (id: string) => void;
  onEditBlockDetails: (block: ScheduledBlock) => void;
}

export const BatchedTimeBlockCard: React.FC<BatchedTimeBlockCardProps> = ({
  block,
  onUpdateBlock,
  onDeleteBlock,
  onEditBlockDetails
}) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState<'school' | 'work'>(
    block.category === 'work' ? 'work' : 'school'
  );

  const durationHours = calculateDurationHours(block.startTime, block.endTime);
  const completedTasksCount = block.subtasks.filter(t => t.completed).length;
  const totalTasksCount = block.subtasks.length;

  const handleToggleFlexible = () => {
    onUpdateBlock({
      ...block,
      isFlexible: !block.isFlexible
    });
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = block.subtasks.map(t =>
      t.id === subtaskId ? { ...t, completed: !t.completed } : t
    );
    onUpdateBlock({
      ...block,
      subtasks: updatedSubtasks
    });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updatedSubtasks = block.subtasks.filter(t => t.id !== subtaskId);
    onUpdateBlock({
      ...block,
      subtasks: updatedSubtasks
    });
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask: GroupedSubtask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: taskTitle.trim(),
      completed: false,
      category: taskCategory
    };

    onUpdateBlock({
      ...block,
      subtasks: [...block.subtasks, newTask]
    });

    setTaskTitle('');
    setIsAddingTask(false);
  };

  // Category visual tag meta
  const categoryMeta = {
    school: {
      label: 'School',
      colorText: 'text-blue-700 dark:text-blue-300',
      bgTag: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    },
    work: {
      label: 'Work',
      colorText: 'text-amber-700 dark:text-amber-300',
      bgTag: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    },
    buffer: {
      label: 'Buffer',
      colorText: 'text-emerald-700 dark:text-emerald-300',
      bgTag: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    },
    personal: {
      label: 'Personal',
      colorText: 'text-purple-700 dark:text-purple-300',
      bgTag: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
    }
  }[block.category] || {
    label: block.category,
    colorText: 'text-slate-700 dark:text-slate-300',
    bgTag: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border rounded-xl p-5 transition-all shadow-2xs ${
        block.isFlexible
          ? 'border-emerald-200/80 dark:border-emerald-800/80 hover:border-emerald-300 dark:hover:border-emerald-700'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Top Header of Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {formatTime12h(block.startTime)} – {formatTime12h(block.endTime)}
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {formatHoursAndMinutes(durationHours)}
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${categoryMeta.bgTag}`}>
              {categoryMeta.label}
            </span>

            {/* Flexible Block Toggle / Badge */}
            <button
              type="button"
              onClick={handleToggleFlexible}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                block.isFlexible
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750'
              }`}
              title="Toggle flexible time block to prevent rigid overbooking"
            >
              {block.isFlexible ? (
                <>
                  <ToggleRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Flexible Block</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span>Fixed Block</span>
                </>
              )}
            </button>
          </div>

          <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 mt-1">
            {block.title}
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {totalTasksCount > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mr-2">
              {completedTasksCount}/{totalTasksCount} tasks
            </span>
          )}

          <button
            type="button"
            onClick={() => onEditBlockDetails(block)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Edit block schedule"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteBlock(block.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Delete this block"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grouped Batched Tasks Section (Requirement 3) */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Batched Tasks in this Block
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              (Group similar tasks into one block)
            </span>
          </div>

          {!isAddingTask && (
            <button
              type="button"
              onClick={() => setIsAddingTask(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Group a Task</span>
            </button>
          )}
        </div>

        {/* Tasks list */}
        {block.subtasks.length === 0 && !isAddingTask ? (
          <div className="py-3 px-3.5 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>No micro-tasks grouped yet. Add similar tasks to tackle them in this single time block.</span>
            <button
              type="button"
              onClick={() => setIsAddingTask(true)}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer"
            >
              + Add First Task
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {block.subtasks.map(task => (
              <div
                key={task.id}
                className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border transition-all ${
                  task.completed
                    ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(task.id)}
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
                      task.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-slate-500 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {task.completed && <Check className="w-3 h-3" />}
                  </button>

                  <span
                    className={`text-xs break-words ${
                      task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-medium capitalize px-1.5 py-0.5 rounded ${
                      task.category === 'school'
                        ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300'
                        : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {task.category}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(task.id)}
                    className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 p-0.5 rounded cursor-pointer transition-colors"
                    title="Remove task"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inline Add Task Form */}
        {isAddingTask && (
          <form
            onSubmit={handleAddSubtask}
            className="mt-2.5 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col gap-2.5"
          >
            <input
              type="text"
              placeholder="e.g. Read chapter 4 questions, or Send weekly status report..."
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              autoFocus
              className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded focus:outline-hidden"
            />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTaskCategory('school')}
                  className={`px-2 py-0.5 text-[11px] rounded transition-colors cursor-pointer ${
                    taskCategory === 'school'
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  School
                </button>
                <button
                  type="button"
                  onClick={() => setTaskCategory('work')}
                  className={`px-2 py-0.5 text-[11px] rounded transition-colors cursor-pointer ${
                    taskCategory === 'work'
                      ? 'bg-amber-600 text-white font-medium'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Work
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!taskTitle.trim()}
                  className="px-3 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white disabled:opacity-40 rounded cursor-pointer transition-colors"
                >
                  Add Task
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
