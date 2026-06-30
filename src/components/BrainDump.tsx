/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { BrainCircuit, Send, Loader2, Sparkles, Plus, ClipboardCheck, MessageSquare, Trash2, Check, ArrowRight } from "lucide-react";
import { Task, Note, EnergyLevel } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface BrainDumpProps {
  onImportTasks: (tasks: Task[]) => void;
  onImportNotes: (notes: Note[]) => void;
  onAddXp: (amount: number) => void;
}

const ENCOURAGING_LOADING_MESSAGES = [
  "Sorting out the mental clutter...",
  "Silencing the background noise...",
  "Mapping things to your energy levels...",
  "Drafting bite-sized micro-steps...",
  "Making things feel doable and simple...",
];

export default function BrainDump({ onImportTasks, onImportNotes, onAddXp }: BrainDumpProps) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Result preview state
  const [parsedTasks, setParsedTasks] = useState<any[]>([]);
  const [parsedNotes, setParsedNotes] = useState<any[]>([]);
  const [hasResults, setHasResults] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % ENCOURAGING_LOADING_MESSAGES.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);
    setHasResults(false);

    try {
      const response = await fetch("/api/gemini/brain-dump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: inputText }),
      });

      if (!response.ok) {
        throw new Error("Failed to process your thoughts. Please try again.");
      }

      const data = await response.json();
      
      // Map extracted values to UI previews
      setParsedTasks(data.tasks || []);
      setParsedNotes(data.notes || []);
      setHasResults(true);
      onAddXp(20); // +20 XP for dumping brain clutter
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearInput = () => {
    setInputText("");
    setError(null);
    setHasResults(false);
  };

  const handleAddSingleTask = (pTask: any, index: number) => {
    const newTask: Task = {
      id: "task-" + Date.now() + "-" + index,
      title: pTask.title,
      description: "",
      completed: false,
      energyLevel: (pTask.energyLevel || "medium") as EnergyLevel,
      estimatedMinutes: pTask.estimatedMinutes || 10,
      substeps: (pTask.substeps || []).map((stepTitle: string, sIdx: number) => ({
        id: "step-" + Date.now() + "-" + sIdx,
        title: stepTitle,
        completed: false,
      })),
      createdAt: new Date().toISOString(),
      pomodoros: 0,
    };

    onImportTasks([newTask]);
    setParsedTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSingleNote = (pNote: any, index: number) => {
    const newNote: Note = {
      id: "note-" + Date.now() + "-" + index,
      content: pNote.content,
      category: pNote.category || "Reflection",
      createdAt: new Date().toISOString(),
    };

    onImportNotes([newNote]);
    setParsedNotes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImportAll = () => {
    const newTasks: Task[] = parsedTasks.map((t, idx) => ({
      id: "task-" + Date.now() + "-all-" + idx,
      title: t.title,
      description: "",
      completed: false,
      energyLevel: (t.energyLevel || "medium") as EnergyLevel,
      estimatedMinutes: t.estimatedMinutes || 10,
      substeps: (t.substeps || []).map((step: string, sIdx: number) => ({
        id: "step-" + Date.now() + "-all-" + idx + "-" + sIdx,
        title: step,
        completed: false,
      })),
      createdAt: new Date().toISOString(),
      pomodoros: 0,
    }));

    const newNotes: Note[] = parsedNotes.map((n, idx) => ({
      id: "note-" + Date.now() + "-all-" + idx,
      content: n.content,
      category: n.category || "Reflection",
      createdAt: new Date().toISOString(),
    }));

    if (newTasks.length > 0) onImportTasks(newTasks);
    if (newNotes.length > 0) onImportNotes(newNotes);

    // Reward extra XP for doing a full cleanup
    onAddXp(30);

    setParsedTasks([]);
    setParsedNotes([]);
    setHasResults(false);
    setInputText("");
  };

  return (
    <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-2xl p-5 shadow-xl" id="brain-dump-container">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
          <BrainCircuit className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-md font-bold text-white tracking-tight flex items-center gap-1.5">
            AI Brain Dump Inbox
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Overwhelmed? Messy thoughts in your head? Just type them here completely unstructured. Let AI organize it into bite-sized steps.
          </p>
        </div>
      </div>

      {!hasResults ? (
        <div className="space-y-3">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder="e.g. 'I need to clean up my room but it is a mess, and also write that report. Oh and buy groceries tonight, need milk. Feeling a bit tired though but I must write a message to Dad...'"
            className="w-full h-32 p-3 text-sm rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500/50 resize-none font-sans transition-all"
            id="brain-dump-textarea"
          />

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center">
            <p className="text-[10px] text-slate-400 font-bold">
              ✨ Clears brain clutter instantly • Gained +20 XP
            </p>
            <div className="flex gap-2">
              {inputText.trim() && (
                <button
                  onClick={handleClearInput}
                  disabled={isLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800/40 border border-slate-700 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-700/40 transition-all"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleProcess}
                disabled={isLoading || !inputText.trim()}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800/40 disabled:text-slate-500 text-xs font-black uppercase tracking-wider text-white rounded-xl transition-all flex items-center gap-1.5 shadow-[0_4px_15px_rgba(99,102,241,0.2)]"
                id="brain-dump-submit-btn"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Organizing...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Process Clutter
                  </>
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-2 text-xs font-bold text-indigo-400 font-mono"
              >
                {ENCOURAGING_LOADING_MESSAGES[loadingMsgIdx]}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-4" id="brain-dump-results">
          <div className="bg-indigo-500/10 rounded-xl border border-indigo-500/20 p-3.5 flex items-center justify-between shadow-[0_0_15px_rgba(99,102,241,0.1)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
              <div>
                <h4 className="font-bold text-white text-xs">Mental Filter Applied!</h4>
                <p className="text-[10px] text-slate-400">Review, tweak, or import everything into your system.</p>
              </div>
            </div>
            <button
              onClick={handleImportAll}
              className="px-3.5 py-2 bg-indigo-500 hover:bg-indigo-600 text-[10px] font-black uppercase tracking-wider text-white rounded-xl transition-all shadow-[0_4px_15px_rgba(99,102,241,0.25)] flex items-center gap-1"
            >
              <Plus className="w-3 h-3 stroke-[2.5px]" /> Import All (+30 XP)
            </button>
          </div>

          {/* Extracted Tasks */}
          {parsedTasks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <ClipboardCheck className="w-3.5 h-3.5 text-indigo-400" /> Extracted Tasks
              </h4>
              <div className="space-y-2">
                {parsedTasks.map((t, idx) => (
                  <div key={idx} className="border border-slate-800/80 rounded-xl p-3 bg-slate-900/30 hover:border-indigo-500/30 transition-colors flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${
                          t.energyLevel === "high" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                          t.energyLevel === "medium" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}>
                          ⚡ {t.energyLevel} Energy
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold font-mono bg-slate-850 px-1.5 py-0.5 rounded-md border border-slate-700/50">{t.estimatedMinutes}m</span>
                      </div>
                      <h5 className="font-bold text-slate-100 text-sm mt-1.5">{t.title}</h5>
                      {t.substeps && t.substeps.length > 0 && (
                        <div className="mt-2 pl-2 border-l border-slate-800 space-y-1">
                          {t.substeps.map((sub: string, sIdx: number) => (
                            <p key={sIdx} className="text-[11px] text-slate-400 flex items-center gap-1">
                              <ArrowRight className="w-2.5 h-2.5 text-slate-600" /> {sub}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddSingleTask(t, idx)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors border border-slate-800"
                      title="Add to List"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Notes / Thoughts */}
          {parsedNotes.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Extracted Reminders & Reflections
              </h4>
              <div className="space-y-2">
                {parsedNotes.map((n, idx) => (
                  <div key={idx} className="border border-slate-800/80 rounded-xl p-3 bg-slate-900/20 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50">
                        {n.category}
                      </span>
                      <p className="text-xs text-slate-300 mt-2 font-sans leading-relaxed">{n.content}</p>
                    </div>
                    <button
                      onClick={() => handleAddSingleNote(n, idx)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors border border-slate-800"
                      title="Keep Note"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleClearInput}
              className="flex-grow py-2.5 rounded-xl bg-slate-800/40 border border-slate-700 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-700/40 transition-all"
            >
              Reset Inbox
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
