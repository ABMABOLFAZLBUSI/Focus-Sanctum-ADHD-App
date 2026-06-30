/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Plus, Check, Trash2, Zap, Clock, ChevronDown, ChevronUp, Sparkles, Loader2, Play, Circle, CheckCircle, PlusCircle, AlertCircle } from "lucide-react";
import { Task, SubStep, EnergyLevel } from "../types";
import { audioEngine } from "../utils/AudioEngine";
import { motion, AnimatePresence } from "motion/react";

interface TaskListProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onSelectTaskForFocus: (taskTitle: string) => void;
  onAddXp: (amount: number) => void;
  onAddCompletedTask: () => void;
  onAddCompletedSubstep: () => void;
}

export default function TaskList({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onSelectTaskForFocus,
  onAddXp,
  onAddCompletedTask,
  onAddCompletedSubstep,
}: TaskListProps) {
  // Task Form State
  const [newTitle, setNewTitle] = useState("");
  const [newEnergy, setNewEnergy] = useState<EnergyLevel>("medium");
  const [newMinutes, setNewMinutes] = useState<number>(15);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Filters State
  const [energyFilter, setEnergyFilter] = useState<"all" | EnergyLevel>("all");
  const [showCompleted, setShowCompleted] = useState(false);

  // Expanded Task State
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // AI Breakdown Loading State
  const [breakingTaskId, setBreakingTaskId] = useState<string | null>(null);

  // Manual Substep Input
  const [substepTextMap, setSubstepTextMap] = useState<Record<string, string>>({});

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: "task-" + Date.now(),
      title: newTitle.trim(),
      description: "",
      completed: false,
      energyLevel: newEnergy,
      estimatedMinutes: Number(newMinutes) || 15,
      substeps: [],
      createdAt: new Date().toISOString(),
      pomodoros: 0,
    };

    onAddTask(newTask);
    setNewTitle("");
    setIsFormOpen(false);
    onAddXp(10); // +10 XP for defining a task!
  };

  const handleToggleTask = (task: Task) => {
    const nextCompleted = !task.completed;
    
    if (nextCompleted) {
      audioEngine.playTaskComplete();
      // Completing a task rewards 50 XP
      onAddXp(50);
      onAddCompletedTask();
    }

    onUpdateTask({
      ...task,
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : undefined,
    });
  };

  const handleToggleSubStep = (task: Task, stepId: string) => {
    const updatedSteps = task.substeps.map((step) => {
      if (step.id === stepId) {
        const nextStepCompleted = !step.completed;
        if (nextStepCompleted) {
          audioEngine.playStepComplete();
          // Completing a subtask rewards 15 XP
          onAddXp(15);
          onAddCompletedSubstep();
        }
        return { ...step, completed: nextStepCompleted };
      }
      return step;
    });

    onUpdateTask({
      ...task,
      substeps: updatedSteps,
    });
  };

  const handleManualAddSubStep = (task: Task) => {
    const text = substepTextMap[task.id] || "";
    if (!text.trim()) return;

    const newStep: SubStep = {
      id: "step-" + Date.now(),
      title: text.trim(),
      completed: false,
    };

    onUpdateTask({
      ...task,
      substeps: [...task.substeps, newStep],
    });

    setSubstepTextMap((prev) => ({ ...prev, [task.id]: "" }));
    onAddXp(5); // +5 XP for mapping your steps
  };

  const handleAiBreakdown = async (task: Task) => {
    setBreakingTaskId(task.id);
    try {
      const response = await fetch("/api/gemini/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: task.title }),
      });

      if (!response.ok) {
        throw new Error("Failed to get breakdown");
      }

      const data = await response.json();
      const generatedSteps: SubStep[] = (data.steps || []).map((step: any, idx: number) => ({
        id: "step-ai-" + Date.now() + "-" + idx,
        title: step.title,
        completed: false,
      }));

      onUpdateTask({
        ...task,
        substeps: [...task.substeps, ...generatedSteps],
      });

      onAddXp(20); // +20 XP for breaking it down!
    } catch (e) {
      console.error("AI breakdown error:", e);
    } finally {
      setBreakingTaskId(null);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesEnergy = energyFilter === "all" || task.energyLevel === energyFilter;
    const matchesCompleted = showCompleted ? true : !task.completed;
    return matchesEnergy && matchesCompleted;
  });

  return (
    <div className="space-y-4" id="task-list-container">
      {/* Filters and Header */}
      <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-2xl p-4.5 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-md font-bold text-white tracking-tight">Focus Boards</h2>
            <p className="text-xs text-slate-400 mt-0.5">Filter by your physical focus or energy level</p>
          </div>
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-3.5 py-2 bg-indigo-500 hover:bg-indigo-600 text-xs font-black uppercase tracking-wider text-white rounded-xl transition-all flex items-center gap-1.5 shadow-[0_4px_15px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)]"
            id="new-task-btn"
          >
            <Plus className="w-4 h-4 stroke-[2.5px]" /> Quick Plan
          </button>
        </div>

        {/* Quick Task Creator Form */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleCreateTask}
              className="overflow-hidden border-t border-slate-800 pt-4 mt-2 space-y-3"
              id="add-task-form"
            >
              <div>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="What is the overwhelming task?"
                  className="w-full p-3 text-sm rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500/50 transition-all"
                  id="task-title-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    🔋 Energy Needed
                  </label>
                  <select
                    value={newEnergy}
                    onChange={(e) => setNewEnergy(e.target.value as EnergyLevel)}
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-hidden font-medium"
                    id="task-energy-select"
                  >
                    <option value="low">💤 Low Energy (Foggy Day)</option>
                    <option value="medium">🔋 Medium Energy (Regular)</option>
                    <option value="high">⚡ High Energy (Focused)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    ⏱️ Est. Minutes
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newMinutes}
                    onChange={(e) => setNewMinutes(Number(e.target.value))}
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-hidden font-mono"
                    id="task-minutes-input"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-700/40 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-xs font-black uppercase tracking-wider text-white rounded-xl transition-all shadow-[0_4px_15px_rgba(99,102,241,0.2)]"
                  id="task-submit-btn"
                >
                  Draft Task (+10 XP)
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Filters Row */}
        <div className="flex flex-col gap-2.5 mt-2 border-t border-slate-800/40 pt-3">
          {/* Dropdown Container: full width */}
          <div className="flex items-center gap-3 w-full bg-slate-950/40 border border-slate-800/60 rounded-xl px-3 py-2">
            <span className="text-[11px] font-bold text-slate-400/60 uppercase tracking-widest shrink-0">Filter</span>
            <div className="relative flex-1">
              <select
                value={energyFilter}
                onChange={(e) => setEnergyFilter(e.target.value as any)}
                className="w-full appearance-none bg-transparent text-xs font-bold text-slate-300 focus:outline-none cursor-pointer pr-8"
                id="energy-filter-select"
              >
                <option value="all" className="bg-slate-950 text-slate-300">🔋 All Tasks</option>
                <option value="high" className="bg-slate-950 text-slate-300">⚡ High Energy</option>
                <option value="medium" className="bg-slate-950 text-slate-300">🔋 Medium Energy</option>
                <option value="low" className="bg-slate-950 text-slate-300">💤 Low Energy</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Toggle Completed: full width */}
          <label
            htmlFor="show-completed"
            className="flex items-center justify-between cursor-pointer group select-none text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors bg-slate-950/40 border border-slate-800/60 rounded-xl px-3.5 py-2.5 w-full"
          >
            <span className="text-[11px] font-bold text-slate-400/60 uppercase tracking-widest">Include Completed</span>
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                id="show-completed"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-5 h-5 rounded bg-slate-900 border border-slate-700 peer-checked:bg-indigo-500/20 peer-checked:border-indigo-400/60 flex items-center justify-center transition-all group-hover:border-slate-500">
                <Check className="w-3.5 h-3.5 text-indigo-300 opacity-0 peer-checked:opacity-100 transition-opacity stroke-[3px]" />
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Task List Render */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-8 text-center backdrop-blur-sm">
            <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">Clean Board!</p>
            <p className="text-xs text-slate-400 mt-1">
              No tasks match this filter. Use "Brain Dump" or "Quick Plan" to capture ideas.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredTasks.map((task) => {
              const isExpanded = expandedTaskId === task.id;
              const completedSubstepsCount = task.substeps.filter((s) => s.completed).length;
              const hasSubsteps = task.substeps.length > 0;

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-slate-900/40 border rounded-2xl p-4 shadow-md transition-all ${
                    task.completed
                      ? "opacity-60 border-slate-800 bg-slate-950/20"
                      : "border-slate-800/80 hover:border-slate-700 bg-slate-900/40"
                  }`}
                  id={`task-item-${task.id}`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleTask(task)}
                      className="mt-0.5 rounded-full text-slate-500 hover:text-emerald-400 transition-colors shrink-0"
                      id={`task-checkbox-${task.id}`}
                    >
                      {task.completed ? (
                        <CheckCircle className="w-5.5 h-5.5 text-emerald-400 stroke-[2px]" />
                      ) : (
                        <Circle className="w-5.5 h-5.5 text-slate-600 hover:text-slate-400 hover:scale-105 transition-all" />
                      )}
                    </button>

                    {/* Task details click zone */}
                    <div
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <h3 className={`font-bold text-slate-100 text-sm md:text-md leading-snug ${
                        task.completed ? "line-through text-slate-500" : ""
                      }`}>
                        {task.title}
                      </h3>

                      <div className="flex items-center gap-2.5 mt-2.5 text-[10px] text-slate-400 font-bold font-mono">
                        <span className={`px-2 py-0.5 rounded-md uppercase font-extrabold tracking-wider border ${
                          task.energyLevel === "high" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                          task.energyLevel === "medium" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}>
                          ⚡ {task.energyLevel}
                        </span>

                        <span className="flex items-center gap-0.5 bg-slate-800/40 px-1.5 py-0.5 rounded-md border border-slate-700/50">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {task.estimatedMinutes}m
                        </span>

                        {hasSubsteps && (
                          <span className="bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-md border border-indigo-500/20">
                            🏁 {completedSubstepsCount}/{task.substeps.length} Steps
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons on the side */}
                    <div className="flex gap-1.5 items-center shrink-0">
                      {!task.completed && (
                        <button
                          onClick={() => onSelectTaskForFocus(task.title)}
                          className="w-8 h-8 flex items-center justify-center text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-all shadow-xs"
                          title="Focus Companion"
                          id={`focus-task-btn-${task.id}`}
                        >
                          <Play className="w-3.5 h-3.5 fill-rose-400 stroke-none" />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-400 bg-slate-800/30 border border-slate-700/50 hover:bg-red-500/10 hover:border-red-500/20 rounded-lg transition-all"
                        title="Delete"
                        id={`delete-task-btn-${task.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Substep & AI Panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-800/80 mt-4 pt-3.5 space-y-3"
                      >
                        {/* Substeps List */}
                        {hasSubsteps && (
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Micro Steps
                            </h4>
                            <div className="space-y-1.5">
                              {task.substeps.map((step) => (
                                <div
                                  key={step.id}
                                  className={`flex items-start gap-2.5 p-2 bg-slate-950/40 rounded-xl border border-slate-800/50 ${
                                    step.completed ? "opacity-60" : ""
                                  }`}
                                >
                                  <button
                                    onClick={() => handleToggleSubStep(task, step.id)}
                                    className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors"
                                  >
                                    {step.completed ? (
                                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                      <Circle className="w-4 h-4" />
                                    )}
                                  </button>
                                  <span className={`text-xs text-slate-300 leading-tight ${
                                    step.completed ? "line-through text-slate-500" : ""
                                  }`}>
                                    {step.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* AI Breakdown Button & Add Custom Steps */}
                        {!task.completed && (
                          <div className="space-y-3 pt-1">
                            {!hasSubsteps && (
                              <button
                                type="button"
                                disabled={breakingTaskId === task.id}
                                onClick={() => handleAiBreakdown(task)}
                                className="w-full py-2.5 bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 hover:bg-indigo-500/20 disabled:bg-slate-800/40 disabled:text-slate-500 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(99,102,241,0.05)]"
                              >
                                {breakingTaskId === task.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                    AI is breaking it down...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
                                    Break down with AI (+20 XP)
                                  </>
                                )}
                              </button>
                            )}

                            {/* Manual Substep Input */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Add small sub-step..."
                                value={substepTextMap[task.id] || ""}
                                onChange={(e) =>
                                  setSubstepTextMap((prev) => ({ ...prev, [task.id]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleManualAddSubStep(task);
                                }}
                                className="flex-1 p-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500/50"
                              />
                              <button
                                onClick={() => handleManualAddSubStep(task)}
                                className="px-3 bg-slate-850 hover:bg-slate-800 border border-slate-850 rounded-xl text-slate-300 transition-colors flex items-center justify-center"
                              >
                                <PlusCircle className="w-4 h-4 text-indigo-400" />
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
