/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ListTodo, Timer, BrainCircuit, Sparkles, Trophy, Download, Upload, Volume2, VolumeX, Flame, RefreshCw, X, Brain, ArrowUpDown, Share2, FileText, Check } from "lucide-react";
import { Task, Note, UserStats, DailyQuest } from "./types";
import { audioEngine } from "./utils/AudioEngine";
import TaskList from "./components/TaskList";
import FocusTimer from "./components/FocusTimer";
import BrainDump from "./components/BrainDump";
import DopamineMenu from "./components/DopamineMenu";
import StatsDashboard from "./components/StatsDashboard";
import { motion, AnimatePresence } from "motion/react";
import { generateProgressCard } from "./utils/ScreenshotGenerator";

const DEFAULT_STATS: UserStats = {
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  streak: 1,
  lastActiveDate: new Date().toLocaleDateString(),
  totalFocusMinutes: 0,
  completedTasksCount: 0,
  completedSubstepsCount: 0,
};

const DEFAULT_QUESTS: DailyQuest[] = [
  { id: "q-tasks", title: "Complete 1 Major Task", target: 1, current: 0, completed: false, xpReward: 100, type: "tasks" },
  { id: "q-steps", title: "Tick off 3 Micro-Steps", target: 3, current: 0, completed: false, xpReward: 60, type: "substeps" },
  { id: "q-focus", title: "Focus for 10 Minutes on Timer", target: 10, current: 0, completed: false, xpReward: 80, type: "focus" },
  { id: "q-dump", title: "Clear Your Mind (Brain Dump once)", target: 1, current: 0, completed: false, xpReward: 50, type: "braindump" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"plan" | "focus" | "dump" | "booster" | "progress">("plan");

  // Core Storage States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [quests, setQuests] = useState<DailyQuest[]>(DEFAULT_QUESTS);

  // Focus context transfer
  const [focusedTaskTitle, setFocusedTaskTitle] = useState<string>("");

  // Level Up Overlay State
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpNumber, setLevelUpNumber] = useState(1);

  // Nickname Modal State
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [tempNickname, setTempNickname] = useState("");

  // Audio mute state (global toggle)
  const [isMuted, setIsMuted] = useState(false);

  // Unified Data Action and Progress Share modal state
  const [showDataActionModal, setShowDataActionModal] = useState(false);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showClipboardImport, setShowClipboardImport] = useState(false);
  const [pastedBackupText, setPastedBackupText] = useState("");
  const [generatedCardUrl, setGeneratedCardUrl] = useState<string | null>(null);

  // Synchronize temp nickname with current nickname on open
  useEffect(() => {
    if (showNicknameModal) {
      setTempNickname(stats.nickname || "");
    }
  }, [showNicknameModal, stats.nickname]);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem("adhd_tasks");
      const storedNotes = localStorage.getItem("adhd_notes");
      const storedStats = localStorage.getItem("adhd_stats");
      const storedQuests = localStorage.getItem("adhd_quests");

      if (storedTasks) setTasks(JSON.parse(storedTasks));
      if (storedNotes) setNotes(JSON.parse(storedNotes));
      if (storedStats) {
        const parsedStats = JSON.parse(storedStats);
        setStats(parsedStats);
        checkStreakAndDateReset(parsedStats);
        if (!parsedStats.nickname) {
          setShowNicknameModal(true);
        }
      } else {
        setShowNicknameModal(true);
      }
      if (storedQuests) setQuests(JSON.parse(storedQuests));
    } catch (e) {
      console.error("Failed to load local storage data:", e);
    }
  }, []);

  const handleSaveNickname = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setStats((prev) => ({
      ...prev,
      nickname: trimmedName,
    }));
    setShowNicknameModal(false);
    triggerHaptic([100, 50, 100]);
  };

  // Save changes to LocalStorage
  useEffect(() => {
    localStorage.setItem("adhd_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("adhd_notes", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem("adhd_stats", JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem("adhd_quests", JSON.stringify(quests));
  }, [quests]);

  // Handle streak checks and daily reset
  const checkStreakAndDateReset = (currentStats: UserStats) => {
    const todayStr = new Date().toLocaleDateString();
    const lastActive = currentStats.lastActiveDate;

    if (lastActive !== todayStr) {
      let nextStreak = currentStats.streak;
      
      if (lastActive) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString();

        if (lastActive === yesterdayStr) {
          // Maintained streak!
          nextStreak += 1;
        } else {
          // Broke streak, reset
          nextStreak = 1;
        }
      }

      setStats((prev) => ({
        ...prev,
        streak: nextStreak,
        lastActiveDate: todayStr,
      }));

      // Reset quests for the new day
      setQuests(DEFAULT_QUESTS);
    }
  };

  // Tactile trigger for physical haptic vibration feedback
  const triggerHaptic = (pattern: number | number[]) => {
    if ("vibrate" in navigator && !isMuted) {
      navigator.vibrate(pattern);
    }
  };

  // Gamification Core: Add XP and level-up check
  const handleAddXp = (amount: number) => {
    triggerHaptic(60);

    setStats((prev) => {
      // Apply streak XP multiplier (e.g., +10% for every 2 streak days, capped at 1.5x multiplier)
      const multiplier = Math.min(1 + Math.floor(prev.streak / 2) * 0.1, 1.5);
      const earnedXp = Math.round(amount * multiplier);

      let newXp = prev.xp + earnedXp;
      let nextLevel = prev.level;
      let nextXpMax = prev.xpToNextLevel;
      let leveledUp = false;

      while (newXp >= nextXpMax) {
        newXp -= nextXpMax;
        nextLevel += 1;
        nextXpMax = Math.round(nextXpMax * 1.25);
        leveledUp = true;
      }

      if (leveledUp) {
        // Trigger physical double-rumble on phones!
        triggerHaptic([150, 80, 200]);
        // Delay visual celebration for user attention
        setTimeout(() => {
          audioEngine.playLevelUp();
          setLevelUpNumber(nextLevel);
          setShowLevelUpModal(true);
        }, 300);
      }

      return {
        ...prev,
        level: nextLevel,
        xp: newXp,
        xpToNextLevel: nextXpMax,
      };
    });
  };

  // Update specific quest progress
  const handleUpdateQuestProgress = (type: "tasks" | "substeps" | "focus" | "braindump", incrementValue: number) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.type === type && !q.completed) {
          const nextCurrent = q.current + incrementValue;
          const isCompletedNow = nextCurrent >= q.target;
          if (isCompletedNow) {
            // Reward quest completion XP instantly
            setTimeout(() => {
              handleAddXp(q.xpReward);
              triggerHaptic([100, 50, 100]);
            }, 600);
          }
          return {
            ...q,
            current: nextCurrent,
            completed: isCompletedNow,
          };
        }
        return q;
      })
    );
  };

  // Import task list from Brain Dump
  const handleImportTasks = (newTasks: Task[]) => {
    setTasks((prev) => [...newTasks, ...prev]);
    handleUpdateQuestProgress("braindump", 1);
  };

  // Import note list from Brain Dump
  const handleImportNotes = (newNotes: Note[]) => {
    setNotes((prev) => [...newNotes, ...prev]);
    handleUpdateQuestProgress("braindump", 1);
  };

  // Select a task and jump automatically to Focus Timer tab (ADHD-friendly action routing)
  const handleSelectTaskForFocus = (taskTitle: string) => {
    setFocusedTaskTitle(taskTitle);
    setActiveTab("focus");
    triggerHaptic(50);
  };

  // Import/Export Backup
  const handleExportBackup = () => {
    const backupData = {
      tasks,
      notes,
      stats,
      quests,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `adhd_planner_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    triggerHaptic(100);
  };

  const handleCopyBackupToClipboard = () => {
    const backupData = {
      tasks,
      notes,
      stats,
      quests,
    };
    try {
      const text = JSON.stringify(backupData, null, 2);
      navigator.clipboard.writeText(text);
      setCopySuccess(true);
      triggerHaptic(80);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      alert("Could not copy automatically. Please export as JSON instead.");
    }
  };

  const handleRestoreFromText = (text: string) => {
    try {
      const data = JSON.parse(text.trim());
      if (data.tasks) setTasks(data.tasks);
      if (data.notes) setNotes(data.notes);
      if (data.stats) setStats(data.stats);
      if (data.quests) setQuests(data.quests);
      
      triggerHaptic([100, 50, 100]);
      alert("Restored focus logs and stats successfully!");
      setShowDataActionModal(false);
      setShowClipboardImport(false);
      setPastedBackupText("");
    } catch (err) {
      alert("Invalid JSON format. Please verify and try again.");
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.tasks) setTasks(data.tasks);
        if (data.notes) setNotes(data.notes);
        if (data.stats) setStats(data.stats);
        if (data.quests) setQuests(data.quests);
        
        triggerHaptic([100, 50, 100]);
        alert("Restored focus logs and stats successfully!");
      } catch (err) {
        alert("Invalid backup file structure.");
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadProgressCard = async () => {
    try {
      setScreenshotLoading(true);
      triggerHaptic(80);
      const dataUrl = await generateProgressCard(stats);
      setGeneratedCardUrl(dataUrl);
      
      try {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `${stats.nickname || "focus"}_sanctum_progress_card.png`;
        link.click();
      } catch (downloadErr) {
        console.warn("Direct browser download failed or blocked in this environment. Showing preview instead.", downloadErr);
      }
      
      triggerHaptic([100, 50, 100]);
    } catch (err) {
      console.error(err);
      alert("Failed to compile progress card graphic.");
    } finally {
      setScreenshotLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans pb-28 md:pb-6" id="main-layout-container">
      {/* Top Header */}
      <header className="bg-slate-950/60 backdrop-blur-md border-b border-white/5 sticky top-0 z-40 px-4 py-3 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.25)]">
              <Brain className="w-5 h-5 text-indigo-400 fill-indigo-400/30" />
            </div>
            <div>
              <h1
                onClick={() => {
                  setShowNicknameModal(true);
                  triggerHaptic(50);
                }}
                className="text-sm sm:text-md font-bold tracking-tight text-white flex items-center gap-1 cursor-pointer hover:text-indigo-300 transition-colors"
                title="Edit character nickname"
              >
                {stats.nickname || "Focus Sanctum"}
                <span className="text-[10px] text-indigo-400 opacity-60 hover:opacity-100">✎</span>
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 transition-all duration-500"
                    style={{ width: `${(stats.xp / stats.xpToNextLevel) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] font-extrabold font-mono text-indigo-300 uppercase tracking-wider">
                  LVL {stats.level}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Settings Utilities */}
          <div className="flex items-center gap-2">
            {/* Sync & Share Action Button */}
            <button
              onClick={() => {
                setShowDataActionModal(true);
                triggerHaptic(60);
              }}
              className="w-9 h-9 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700/50 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Sync & Share Menu"
              id="btn-sync-share-trigger"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            {/* divider */}
            <span className="w-px h-5 bg-slate-800" />

            {/* sound controls */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="w-9 h-9 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700/50 text-slate-400 hover:text-white flex items-center justify-center transition-all"
              id="btn-mute-toggle"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Stage (Centered Mobile Frame Layout) */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Streak Banner in Immersive Style */}
        <div className="px-4 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-between shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500/20 animate-pulse" />
            <span className="text-xs font-bold text-slate-200">Continuous Focus Streak</span>
          </div>
          <span className="text-xs font-black text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
            {stats.streak} Day{stats.streak !== 1 ? "s" : ""}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "plan" && (
            <motion.div
              key="tab-plan"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <TaskList
                tasks={tasks}
                onAddTask={(newTask) => setTasks([newTask, ...tasks])}
                onUpdateTask={(updatedTask) =>
                  setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)))
                }
                onDeleteTask={(id) => {
                  setTasks((prev) => prev.filter((t) => t.id !== id));
                  triggerHaptic(50);
                }}
                onSelectTaskForFocus={handleSelectTaskForFocus}
                onAddXp={handleAddXp}
                onAddCompletedTask={() => {
                  setStats((prev) => ({ ...prev, completedTasksCount: prev.completedTasksCount + 1 }));
                  handleUpdateQuestProgress("tasks", 1);
                }}
                onAddCompletedSubstep={() => {
                  setStats((prev) => ({ ...prev, completedSubstepsCount: prev.completedSubstepsCount + 1 }));
                  handleUpdateQuestProgress("substeps", 1);
                }}
              />
            </motion.div>
          )}

          {activeTab === "focus" && (
            <motion.div
              key="tab-focus"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <FocusTimer
                selectedTaskTitle={focusedTaskTitle}
                onAddXp={handleAddXp}
                onAddFocusMinutes={(mins) => {
                  setStats((prev) => ({ ...prev, totalFocusMinutes: prev.totalFocusMinutes + mins }));
                  handleUpdateQuestProgress("focus", mins);
                }}
              />
            </motion.div>
          )}

          {activeTab === "dump" && (
            <motion.div
              key="tab-dump"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <BrainDump
                onImportTasks={handleImportTasks}
                onImportNotes={handleImportNotes}
                onAddXp={handleAddXp}
              />
            </motion.div>
          )}

          {activeTab === "booster" && (
            <motion.div
              key="tab-booster"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <DopamineMenu onAddXp={handleAddXp} />
            </motion.div>
          )}

          {activeTab === "progress" && (
            <motion.div
              key="tab-progress"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <StatsDashboard
                stats={stats}
                quests={quests}
                onClaimQuestXp={(qId, xp) => {
                  handleAddXp(xp);
                  setQuests((prev) => prev.map((q) => (q.id === qId ? { ...q, completed: true } : q)));
                }}
                onUpdateStats={(updatedStats) => setStats(updatedStats)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Symmetrical Tactile Bottom Mobile Navigation Drawer */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-lg border-t border-white/5 shadow-2xl px-4 py-2.5 z-40 md:sticky md:bottom-4 md:max-w-md md:mx-auto md:rounded-2xl md:border md:mb-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {[
            { id: "plan", icon: <ListTodo className="w-5 h-5" />, label: "Plan" },
            { id: "focus", icon: <Timer className="w-5 h-5" />, label: "Focus" },
            { id: "dump", icon: <BrainCircuit className="w-5 h-5" />, label: "Dump" },
            { id: "booster", icon: <Sparkles className="w-5 h-5" />, label: "Booster" },
            { id: "progress", icon: <Trophy className="w-5 h-5" />, label: "Progress" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  triggerHaptic(40);
                }}
                className={`flex flex-col items-center flex-1 py-1 transition-all relative ${
                  isActive ? "text-indigo-400 font-extrabold" : "text-slate-400/60 hover:text-slate-200"
                }`}
                id={`nav-tab-${tab.id}`}
              >
                {/* Active Indicator Bar (Matches design guidelines) */}
                {isActive && (
                  <motion.div
                    layoutId="nav-bar"
                    className="absolute -top-1 w-6 h-1 bg-indigo-400 rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {tab.icon}
                <span className="text-[10px] font-bold uppercase mt-1.5 tracking-wider font-sans">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Full Screen Level Up Celebratory Modal */}
      <AnimatePresence>
        {showLevelUpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-6"
            id="level-up-overlay"
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 30 }}
              className="bg-[#0b0c1e] rounded-3xl p-8 max-w-sm w-full text-center border border-indigo-500/30 shadow-2xl shadow-indigo-500/10 relative overflow-hidden"
              style={{ background: "radial-gradient(circle at 50% 50%, #171833 0%, #05060f 100%)" }}
            >
              {/* Confetti-style background beams */}
              <div className="absolute -left-16 -top-16 w-44 h-44 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />
              <div className="absolute -right-16 -bottom-16 w-44 h-44 bg-purple-500/20 rounded-full blur-2xl animate-pulse" />

              <div className="relative z-10 space-y-5">
                <div className="w-24 h-24 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] mx-auto animate-bounce">
                  <Trophy className="w-12 h-12 text-indigo-400 fill-indigo-400/20" />
                </div>
                
                <h3 className="text-2xl font-black text-white tracking-tight">Level Increased!</h3>
                
                <div className="text-6xl font-black font-mono text-indigo-400 my-4 tracking-tighter" style={{ filter: "drop-shadow(0 0 15px rgba(129,140,248,0.5))" }}>
                  {levelUpNumber}
                </div>

                <p className="text-sm text-slate-300 max-w-xs mx-auto leading-relaxed font-medium">
                  Your dopamine reservoirs are refilled. You are mapping your ADHD mind to real accomplishment. Sensational effort!
                </p>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      setShowLevelUpModal(false);
                      triggerHaptic(50);
                    }}
                    className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-xs font-black uppercase tracking-widest text-white rounded-2xl shadow-[0_10px_30px_rgba(99,102,241,0.4)] transition-all active:scale-95"
                    id="level-up-dismiss"
                  >
                    Claim Rewards
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Screen / Nickname Set Modal */}
      <AnimatePresence>
        {showNicknameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-6"
            id="nickname-setup-overlay"
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 30 }}
              className="bg-[#0b0c1e] rounded-3xl p-8 max-w-sm w-full border border-indigo-500/30 shadow-2xl shadow-indigo-500/10 relative overflow-hidden"
              style={{ background: "radial-gradient(circle at 50% 50%, #171833 0%, #05060f 100%)" }}
            >
              {/* Background ambient lighting */}
              <div className="absolute -left-16 -top-16 w-44 h-44 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />
              <div className="absolute -right-16 -bottom-16 w-44 h-44 bg-purple-500/20 rounded-full blur-2xl animate-pulse" />

              <div className="relative z-10 space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.25)] mx-auto">
                  <Brain className="w-8 h-8 text-indigo-400 fill-indigo-400/20 animate-pulse" />
                </div>
                
                <div className="text-center">
                  <h3 className="text-xl font-black text-white tracking-tight">Focus Sanctum</h3>
                  <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider mt-1">Initialize Character</p>
                </div>

                <p className="text-xs text-slate-300 text-center leading-relaxed font-medium">
                  Welcome to your mental sanctuary. Please name the focus character that will level up as you accomplish your micro-steps and tasks.
                </p>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Character Nickname</label>
                  <input
                    type="text"
                    value={tempNickname}
                    onChange={(e) => setTempNickname(e.target.value.slice(0, 20))}
                    placeholder="e.g., Focus Ninja, HyperFocus Hero"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600 font-semibold"
                    autoFocus
                    id="nickname-input-field"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && tempNickname.trim()) {
                        handleSaveNickname(tempNickname);
                      }
                    }}
                  />
                </div>

                <div className="pt-2">
                  <button
                    disabled={!tempNickname.trim()}
                    onClick={() => handleSaveNickname(tempNickname)}
                    className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-xs font-black uppercase tracking-widest text-white rounded-xl shadow-[0_10px_25px_rgba(99,102,241,0.35)] transition-all active:scale-95"
                    id="nickname-submit"
                  >
                    Enter Sanctuary
                  </button>
                  {stats.nickname && (
                    <button
                      onClick={() => {
                        setShowNicknameModal(false);
                        triggerHaptic(50);
                      }}
                      className="w-full mt-2 py-2 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white text-xs font-bold uppercase rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sanctum Sync & Share Modal */}
      <AnimatePresence>
        {showDataActionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            id="sync-share-modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0b0c1e] rounded-3xl p-6 max-w-md w-full border border-indigo-500/30 shadow-2xl relative max-h-[92vh] overflow-y-auto scrollbar-none"
              style={{ background: "radial-gradient(circle at 50% 50%, #161732 0%, #05060f 100%)" }}
            >
              <button
                onClick={() => {
                  setShowDataActionModal(false);
                  setShowClipboardImport(false);
                  setGeneratedCardUrl(null);
                  triggerHaptic(50);
                }}
                className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-900/60 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer z-20"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Glowing Background Spots */}
              <div className="absolute -left-16 -top-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />
              <div className="absolute -right-16 -bottom-16 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl animate-pulse" />

              <div className="relative z-10 space-y-4">
                <div className="text-center">
                  <span className="text-[9px] text-indigo-300 font-extrabold tracking-widest bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-400/20 uppercase">
                    Archive Controls
                  </span>
                  <h3 className="text-lg font-black text-white mt-1.5 tracking-tight">Sync & Share</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Manage your focus dataset and share progress</p>
                </div>

                {/* Progress Card Live Image Preview (for long-press saving on mobile) */}
                {generatedCardUrl && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3.5 bg-slate-950/60 border border-amber-500/30 rounded-2xl text-center space-y-2.5 shadow-inner"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-amber-300 font-black uppercase tracking-wider flex items-center gap-1">
                        ✨ Generated Progress Card
                      </span>
                      <button 
                        onClick={() => setGeneratedCardUrl(null)}
                        className="text-[9px] text-slate-500 hover:text-white uppercase font-black tracking-wider"
                      >
                        [Hide]
                      </button>
                    </div>
                    
                    <img 
                      src={generatedCardUrl} 
                      alt="Progress Card" 
                      className="max-w-full rounded-xl border border-white/10 mx-auto shadow-2xl" 
                      referrerPolicy="no-referrer" 
                    />
                    
                    <p className="text-[10px] text-amber-100/75 leading-relaxed bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 font-medium">
                      📱 <strong>Mobile/APK Tip:</strong> Since direct browser downloads are sometimes restricted inside wrapper APKs, you can <strong>long-press (tap and hold) the image above</strong> to save it directly to your gallery, or take a quick screenshot!
                    </p>
                  </motion.div>
                )}

                {!showClipboardImport ? (
                  <div className="space-y-2.5">
                    {/* Action 1: Export Data as standard file download */}
                    <button
                      onClick={() => {
                        handleExportBackup();
                      }}
                      className="w-full p-3.5 rounded-xl bg-slate-950/60 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-500/30 text-left transition-all flex items-center gap-3 group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 group-hover:bg-indigo-500/20 group-hover:scale-105 transition-all shrink-0">
                        <Download className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-black text-white">Export as .json File</div>
                        <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5 font-medium">Download tasks, metrics, and levels as a local backup file.</p>
                      </div>
                    </button>

                    {/* Action 1B: Copy Raw Data to Clipboard (highly robust fallback for mobile wrappers) */}
                    <button
                      onClick={handleCopyBackupToClipboard}
                      className="w-full p-3.5 rounded-xl bg-slate-950/60 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-500/30 text-left transition-all flex items-center gap-3 group cursor-pointer"
                    >
                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                        copySuccess 
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                          : "bg-indigo-500/10 border-indigo-500/20 text-indigo-300 group-hover:bg-indigo-500/20 group-hover:scale-105"
                      }`}>
                        {copySuccess ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-black text-white flex items-center gap-1.5">
                          Copy Backup text
                          {copySuccess && (
                            <span className="text-[8px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider scale-90">
                              COPIED!
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5 font-medium">
                          {copySuccess ? "Copied to clipboard! Paste it inside any notes app to keep it safe." : "Copies backup raw dataset directly to your clipboard (safest for APKs)."}
                        </p>
                      </div>
                    </button>

                    {/* Action 2: Import Data from file */}
                    <label className="w-full p-3.5 rounded-xl bg-slate-950/60 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-500/30 text-left transition-all flex items-center gap-3 group cursor-pointer">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 group-hover:bg-indigo-500/20 group-hover:scale-105 transition-all shrink-0">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-white">Upload .json Backup File</div>
                        <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5 font-medium">Upload your saved file to restore focus records instantly.</p>
                      </div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          handleImportBackup(e);
                          setShowDataActionModal(false);
                        }}
                        className="hidden"
                      />
                    </label>

                    {/* Action 2B: Paste backup text (robust fallback for mobile) */}
                    <button
                      onClick={() => {
                        setShowClipboardImport(true);
                        triggerHaptic(50);
                      }}
                      className="w-full p-3.5 rounded-xl bg-slate-950/60 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-500/30 text-left transition-all flex items-center gap-3 group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 group-hover:bg-indigo-500/20 group-hover:scale-105 transition-all shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-black text-white">Paste Backup Text</div>
                        <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5 font-medium">Paste backup raw text to restore your stats and tasks without files.</p>
                      </div>
                    </button>

                    {/* Action 3: Share Collector Card */}
                    <button
                      disabled={screenshotLoading}
                      onClick={handleDownloadProgressCard}
                      className="w-full p-3.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/25 hover:border-indigo-500/50 text-left transition-all flex items-center gap-3 group cursor-pointer relative overflow-hidden"
                    >
                      {/* Glowing golden border pulse for the highlighted option */}
                      <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-300 group-hover:bg-amber-500/20 group-hover:scale-105 transition-all shrink-0">
                        {screenshotLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-black text-white flex items-center gap-1.5">
                          Compile Progress Card
                          <span className="text-[8px] bg-amber-400/20 border border-amber-400/40 text-amber-300 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider scale-90">
                            PREMIER
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5 font-medium">
                          {screenshotLoading ? "Synthesizing graphics..." : "Download & preview a high-definition digital collector card showing level & streaks."}
                        </p>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-white/5 animate-fade-in text-left">
                    <span className="text-[9px] text-indigo-300 font-extrabold tracking-widest uppercase block mb-1">
                      Paste Dataset Raw JSON
                    </span>
                    <textarea
                      rows={6}
                      value={pastedBackupText}
                      onChange={(e) => setPastedBackupText(e.target.value)}
                      placeholder='Paste JSON here e.g. { "tasks": [...], "stats": {...} }'
                      className="w-full p-3 bg-slate-900 border border-slate-850 focus:border-indigo-500/50 rounded-xl text-[11px] font-mono text-indigo-100 placeholder-slate-600 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowClipboardImport(false);
                          setPastedBackupText("");
                          triggerHaptic(50);
                        }}
                        className="flex-1 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-white/5 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={!pastedBackupText.trim()}
                        onClick={() => {
                          handleRestoreFromText(pastedBackupText);
                        }}
                        className="flex-1 py-2 text-xs font-black text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 rounded-lg shadow-lg cursor-pointer"
                      >
                        Restore Data
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-1 text-center">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    Focus Sanctum Database System
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

