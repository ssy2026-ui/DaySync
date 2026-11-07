import React, { useState } from 'react';
import { ScheduleTemplate, TemplateBlock, CategoryType } from '../types';
import {
  Plus,
  Trash2,
  Copy,
  Edit2,
  Clock,
  Layers,
  ArrowRight,
  Bookmark,
  Check,
  X,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { formatTime12h, calculateDurationHours, formatHoursAndMinutes } from '../utils/dateUtils';

interface TemplateStudioProps {
  templates: ScheduleTemplate[];
  onSaveTemplates: (templates: ScheduleTemplate[]) => void;
  onApplyTemplateModal: (templateId: string) => void;
}

export const TemplateStudio: React.FC<TemplateStudioProps> = ({
  templates,
  onSaveTemplates,
  onApplyTemplateModal
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id || ''
  );
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [isEditingTemplateMeta, setIsEditingTemplateMeta] = useState<boolean>(false);

  // Active template being viewed/edited
  const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  // Template creation states
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<'school' | 'work' | 'hybrid' | 'custom'>('school');

  // Edit template metadata states
  const [editMetaName, setEditMetaName] = useState('');
  const [editMetaDesc, setEditMetaDesc] = useState('');
  const [editMetaType, setEditMetaType] = useState<'school' | 'work' | 'hybrid' | 'custom'>('school');

  // Block creation inside template
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [blockTitle, setBlockTitle] = useState('');
  const [blockStart, setBlockStart] = useState('09:00');
  const [blockEnd, setBlockEnd] = useState('11:00');
  const [blockCategory, setBlockCategory] = useState<CategoryType>('school');
  const [blockFlexible, setBlockFlexible] = useState(false);

  // Edit existing block inside template
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editBlockTitle, setEditBlockTitle] = useState('');
  const [editBlockStart, setEditBlockStart] = useState('09:00');
  const [editBlockEnd, setEditBlockEnd] = useState('11:00');
  const [editBlockCategory, setEditBlockCategory] = useState<CategoryType>('school');
  const [editBlockFlexible, setEditBlockFlexible] = useState(false);

  // Handlers for Template Management
  const handleStartCreateTemplate = () => {
    setNewTemplateName('');
    setNewTemplateDesc('');
    setNewTemplateType('school');
    setIsCreatingNew(true);
  };

  const handleCreateNewTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const newTpl: ScheduleTemplate = {
      id: `tpl-${Date.now()}`,
      name: newTemplateName.trim(),
      description: newTemplateDesc.trim() || 'Custom scheduled layout for recurring weeks.',
      type: newTemplateType,
      blocks: [
        {
          id: `tb-${Date.now()}-1`,
          title: newTemplateType === 'school' ? 'Morning Academic Focus' : 'Deep Work Focus',
          startTime: '09:00',
          endTime: '12:00',
          category: newTemplateType === 'school' ? 'school' : 'work',
          isFlexible: false,
          defaultSubtaskTitles: []
        },
        {
          id: `tb-${Date.now()}-2`,
          title: 'Lunch & Transition Buffer',
          startTime: '12:00',
          endTime: '13:00',
          category: 'buffer',
          isFlexible: true,
          defaultSubtaskTitles: []
        }
      ]
    };

    const updated = [...templates, newTpl];
    onSaveTemplates(updated);
    setSelectedTemplateId(newTpl.id);
    setIsCreatingNew(false);
  };

  const handleStartEditMeta = () => {
    if (!activeTemplate) return;
    setEditMetaName(activeTemplate.name);
    setEditMetaDesc(activeTemplate.description);
    setEditMetaType(activeTemplate.type);
    setIsEditingTemplateMeta(true);
  };

  const handleSaveEditMeta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMetaName.trim() || !activeTemplate) return;

    const updated = templates.map(t =>
      t.id === activeTemplate.id
        ? {
            ...t,
            name: editMetaName.trim(),
            description: editMetaDesc.trim(),
            type: editMetaType
          }
        : t
    );

    onSaveTemplates(updated);
    setIsEditingTemplateMeta(false);
  };

  const handleDuplicateTemplate = (tpl: ScheduleTemplate) => {
    const dup: ScheduleTemplate = {
      ...tpl,
      id: `tpl-${Date.now()}`,
      name: `${tpl.name} (Copy)`,
      blocks: tpl.blocks.map(b => ({
        ...b,
        id: `tb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      }))
    };
    const updated = [...templates, dup];
    onSaveTemplates(updated);
    setSelectedTemplateId(dup.id);
  };

  const handleDeleteTemplate = (id: string) => {
    if (templates.length <= 1) {
      alert('You must keep at least one template.');
      return;
    }
    if (confirm('Are you sure you want to delete this template?')) {
      const updated = templates.filter(t => t.id !== id);
      onSaveTemplates(updated);
      if (selectedTemplateId === id) {
        setSelectedTemplateId(updated[0].id);
      }
    }
  };

  // Handlers for Blocks inside Template
  const handleAddBlockToTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTitle.trim() || !activeTemplate) return;

    const newBlock: TemplateBlock = {
      id: `tb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: blockTitle.trim(),
      startTime: blockStart,
      endTime: blockEnd,
      category: blockCategory,
      isFlexible: blockFlexible,
      defaultSubtaskTitles: []
    };

    const updated = templates.map(t => {
      if (t.id === activeTemplate.id) {
        return {
          ...t,
          blocks: [...t.blocks, newBlock]
        };
      }
      return t;
    });

    onSaveTemplates(updated);
    setIsAddingBlock(false);
    setBlockTitle('');
    setBlockFlexible(false);
  };

  const handleStartEditBlock = (block: TemplateBlock) => {
    setEditingBlockId(block.id);
    setEditBlockTitle(block.title);
    setEditBlockStart(block.startTime);
    setEditBlockEnd(block.endTime);
    setEditBlockCategory(block.category);
    setEditBlockFlexible(block.isFlexible);
  };

  const handleSaveEditBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBlockTitle.trim() || !activeTemplate || !editingBlockId) return;

    const updated = templates.map(t => {
      if (t.id === activeTemplate.id) {
        return {
          ...t,
          blocks: t.blocks.map(b =>
            b.id === editingBlockId
              ? {
                  ...b,
                  title: editBlockTitle.trim(),
                  startTime: editBlockStart,
                  endTime: editBlockEnd,
                  category: editBlockCategory,
                  isFlexible: editBlockFlexible
                }
              : b
          )
        };
      }
      return t;
    });

    onSaveTemplates(updated);
    setEditingBlockId(null);
  };

  const handleDeleteBlockFromTemplate = (blockId: string) => {
    if (!activeTemplate) return;
    const updated = templates.map(t => {
      if (t.id === activeTemplate.id) {
        return {
          ...t,
          blocks: t.blocks.filter(b => b.id !== blockId)
        };
      }
      return t;
    });
    onSaveTemplates(updated);
  };

  const handleToggleBlockFlexible = (blockId: string) => {
    if (!activeTemplate) return;
    const updated = templates.map(t => {
      if (t.id === activeTemplate.id) {
        return {
          ...t,
          blocks: t.blocks.map(b =>
            b.id === blockId ? { ...b, isFlexible: !b.isFlexible } : b
          )
        };
      }
      return t;
    });
    onSaveTemplates(updated);
  };

  return (
    <div className="space-y-6">
      {/* Clear Instructions Banner (Requirement 3) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowInstructions(!showInstructions)}>
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              How Schedule Templates Work
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              (Quick 4-Step Guide)
            </span>
          </div>
          <button
            type="button"
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
          >
            <span>{showInstructions ? 'Hide Guide' : 'Show Guide'}</span>
            {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showInstructions && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                1. Select or Create
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Choose a template like <span className="font-medium text-blue-600 dark:text-blue-400">School Day</span> or <span className="font-medium text-amber-600 dark:text-amber-400">Work-Only Day</span>, or click "Create Template" to make your own.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                2. Structure Time Blocks
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Add start and end times for lectures or sprints. Mark non-rigid periods as <span className="font-medium text-emerald-600 dark:text-emerald-400">Flexible Buffer</span> to avoid overbooking.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                3. Group Similar Tasks
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                On the daily schedule, add grouped subtasks inside each block so you batch similar responsibilities together.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                4. Apply Across Weeks
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Click <span className="font-semibold text-slate-900 dark:text-white">"Deploy to Schedule"</span> to apply this routine to single days or recurring weekdays across the next 4 calendar weeks.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Schedule Templates
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build once, apply across the calendar. Eliminates rebuilding schedules from scratch each day.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartCreateTemplate}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg transition-colors cursor-pointer self-start sm:self-auto shadow-xs whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create New Template</span>
        </button>
      </div>

      {/* Main Grid: Template List vs Active Template Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Template Cards List */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Templates Library ({templates.length})
          </span>

          <div className="space-y-2.5">
            {templates.map(tpl => {
              const isSelected = tpl.id === selectedTemplateId;
              const totalBlocks = tpl.blocks.length;

              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-slate-900 dark:border-slate-400 bg-white dark:bg-slate-800 shadow-xs ring-1 ring-slate-900/10 dark:ring-slate-400/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {tpl.name}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        tpl.type === 'school'
                          ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300'
                          : tpl.type === 'work'
                          ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                          : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      {tpl.type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {tpl.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                    <span className="font-mono">{totalBlocks} time blocks</span>
                    <span className="font-medium text-slate-900 dark:text-slate-200 flex items-center gap-0.5">
                      Configure →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Template Details & Block Editor */}
        {activeTemplate && (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs transition-colors">
              {/* Template Meta Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                      {activeTemplate.name}
                    </h2>
                    <span className="text-xs capitalize font-medium text-slate-500 dark:text-slate-400">
                      ({activeTemplate.type} layout)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                    {activeTemplate.description}
                  </p>
                </div>

                {/* All Functional Controls */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onApplyTemplateModal(activeTemplate.id)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                    title="Deploy this template to specific days or recurring weekdays"
                  >
                    <span>Deploy to Schedule</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleStartEditMeta}
                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit template name and description"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicateTemplate(activeTemplate)}
                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Duplicate template"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {templates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(activeTemplate.id)}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Edit Template Metadata Drawer */}
              {isEditingTemplateMeta && (
                <form onSubmit={handleSaveEditMeta} className="my-4 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Edit Template Details
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingTemplateMeta(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Template Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editMetaName}
                      onChange={e => setEditMetaName(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={editMetaDesc}
                      onChange={e => setEditMetaDesc(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditMetaType('school')}
                        className={`px-2.5 py-1 text-xs rounded-md cursor-pointer ${
                          editMetaType === 'school'
                            ? 'bg-blue-600 text-white font-medium'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        School
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMetaType('work')}
                        className={`px-2.5 py-1 text-xs rounded-md cursor-pointer ${
                          editMetaType === 'work'
                            ? 'bg-amber-600 text-white font-medium'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Work
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMetaType('hybrid')}
                        className={`px-2.5 py-1 text-xs rounded-md cursor-pointer ${
                          editMetaType === 'hybrid'
                            ? 'bg-emerald-600 text-white font-medium'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Hybrid
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg cursor-pointer"
                    >
                      Save Details
                    </button>
                  </div>
                </form>
              )}

              {/* Template Blocks List */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Template Blocks ({activeTemplate.blocks.length})
                  </span>
                  {!isAddingBlock && (
                    <button
                      type="button"
                      onClick={() => setIsAddingBlock(true)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Block to Template</span>
                    </button>
                  )}
                </div>

                {activeTemplate.blocks.map((block) => {
                  const dur = calculateDurationHours(block.startTime, block.endTime);
                  const isEditingThisBlock = editingBlockId === block.id;

                  if (isEditingThisBlock) {
                    return (
                      <form
                        key={block.id}
                        onSubmit={handleSaveEditBlock}
                        className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            Edit Block Details
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingBlockId(null)}
                            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>

                        <div>
                          <input
                            type="text"
                            required
                            value={editBlockTitle}
                            onChange={e => setEditBlockTitle(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded focus:outline-hidden"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                              Start Time
                            </label>
                            <input
                              type="time"
                              required
                              value={editBlockStart}
                              onChange={e => setEditBlockStart(e.target.value)}
                              className="w-full text-xs px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                              End Time
                            </label>
                            <input
                              type="time"
                              required
                              value={editBlockEnd}
                              onChange={e => setEditBlockEnd(e.target.value)}
                              className="w-full text-xs px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditBlockCategory('school')}
                              className={`px-2 py-1 text-xs rounded cursor-pointer ${
                                editBlockCategory === 'school'
                                  ? 'bg-blue-600 text-white font-medium'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              School
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditBlockCategory('work')}
                              className={`px-2 py-1 text-xs rounded cursor-pointer ${
                                editBlockCategory === 'work'
                                  ? 'bg-amber-600 text-white font-medium'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              Work
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditBlockCategory('buffer')}
                              className={`px-2 py-1 text-xs rounded cursor-pointer ${
                                editBlockCategory === 'buffer'
                                  ? 'bg-emerald-600 text-white font-medium'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              Buffer
                            </button>
                          </div>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editBlockFlexible}
                              onChange={e => setEditBlockFlexible(e.target.checked)}
                              className="rounded text-emerald-600"
                            />
                            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                              Flexible Buffer
                            </span>
                          </label>

                          <button
                            type="submit"
                            className="px-3.5 py-1 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded cursor-pointer"
                          >
                            Update Block
                          </button>
                        </div>
                      </form>
                    );
                  }

                  return (
                    <div
                      key={block.id}
                      className="flex items-center justify-between gap-3 p-3.5 bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 tabular-nums shrink-0">
                          {formatTime12h(block.startTime)} – {formatTime12h(block.endTime)}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums shrink-0">
                          {formatHoursAndMinutes(dur)}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {block.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleBlockFlexible(block.id)}
                          className={`text-xs px-2 py-0.5 rounded cursor-pointer transition-colors ${
                            block.isFlexible
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-medium'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                          title="Toggle flexible buffer status"
                        >
                          {block.isFlexible ? 'Flexible' : 'Fixed'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEditBlock(block)}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded cursor-pointer"
                          title="Edit this block"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBlockFromTemplate(block.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded cursor-pointer"
                          title="Delete block from template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add Block Form Drawer */}
                {isAddingBlock && (
                  <form
                    onSubmit={handleAddBlockToTemplate}
                    className="p-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Add New Block to Template
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingBlock(false)}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <input
                      type="text"
                      required
                      placeholder="Block title (e.g. Afternoon Focus Session)"
                      value={blockTitle}
                      onChange={e => setBlockTitle(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded focus:outline-hidden"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          required
                          value={blockStart}
                          onChange={e => setBlockStart(e.target.value)}
                          className="w-full text-xs px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          required
                          value={blockEnd}
                          onChange={e => setBlockEnd(e.target.value)}
                          className="w-full text-xs px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setBlockCategory('school')}
                          className={`px-2 py-1 text-xs rounded cursor-pointer ${
                            blockCategory === 'school'
                              ? 'bg-blue-600 text-white font-medium'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          School
                        </button>
                        <button
                          type="button"
                          onClick={() => setBlockCategory('work')}
                          className={`px-2 py-1 text-xs rounded cursor-pointer ${
                            blockCategory === 'work'
                              ? 'bg-amber-600 text-white font-medium'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          Work
                        </button>
                        <button
                          type="button"
                          onClick={() => setBlockCategory('buffer')}
                          className={`px-2 py-1 text-xs rounded cursor-pointer ${
                            blockCategory === 'buffer'
                              ? 'bg-emerald-600 text-white font-medium'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          Buffer
                        </button>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={blockFlexible}
                          onChange={e => setBlockFlexible(e.target.checked)}
                          className="rounded text-emerald-600"
                        />
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                          Flexible Buffer
                        </span>
                      </label>

                      <button
                        type="submit"
                        disabled={!blockTitle.trim()}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white disabled:opacity-40 rounded cursor-pointer"
                      >
                        Save Block
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create Template */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Create Schedule Template
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Intensive Lab Day, or Client Sprint Day"
                  value={newTemplateName}
                  onChange={e => setNewTemplateName(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain when to use this template..."
                  value={newTemplateDesc}
                  onChange={e => setNewTemplateDesc(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Domain
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTemplateType('school')}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      newTemplateType === 'school'
                        ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-600 text-blue-800 dark:text-blue-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    School
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTemplateType('work')}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      newTemplateType === 'work'
                        ? 'bg-amber-50 dark:bg-amber-900/50 border-amber-600 text-amber-800 dark:text-amber-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Work
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTemplateType('hybrid')}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      newTemplateType === 'hybrid'
                        ? 'bg-emerald-50 dark:bg-emerald-900/50 border-emerald-600 text-emerald-800 dark:text-emerald-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Hybrid
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTemplateName.trim()}
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white disabled:opacity-40 rounded-lg cursor-pointer"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
