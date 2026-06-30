/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserStats } from "../types";
import { Sparkles, Shield, Zap, Compass, ChevronLeft, ChevronRight, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CharacterSectionProps {
  stats: UserStats;
  onUpdateStats?: (newStats: UserStats) => void;
}

interface CharacterClass {
  id: string;
  name: string;
  emoji: string;
  color: string;
  glowColor: string;
  description: string;
  perk: string;
  perkDesc: string;
}

const CHARACTER_CLASSES: CharacterClass[] = [
  {
    id: "astral",
    name: "Astral Voyager",
    emoji: "🔮",
    color: "from-indigo-500 to-purple-600",
    glowColor: "rgba(99, 102, 241, 0.4)",
    description: "Navigates cosmic oceans of meditation, transforming raw thoughts into stellar creations.",
    perk: "+15% Focus Efficiency",
    perkDesc: "Deep mindfulness booster for longer blocks."
  },
  {
    id: "hyperdrive",
    name: "Hyperdrive Specialist",
    emoji: "⚡",
    color: "from-amber-400 to-orange-500",
    glowColor: "rgba(245, 158, 11, 0.4)",
    description: "Operates at lightning speeds, crushing tasks and micro-steps with sheer kinetic velocity.",
    perk: "+20% Sprint Multiplier",
    perkDesc: "Perfect for fast-paced pomodoro routines."
  },
  {
    id: "sentinel",
    name: "Zen Sentinel",
    emoji: "🛡️",
    color: "from-emerald-400 to-teal-600",
    glowColor: "rgba(16, 185, 129, 0.4)",
    description: "An immovable fortress of stillness, absorbing ambient noise and repelling distractions.",
    perk: "ADHD Distraction Shield",
    perkDesc: "Provides passive defense against brain fatigue."
  },
  {
    id: "alchemist",
    name: "Thought Alchemist",
    emoji: "🧪",
    color: "from-pink-500 to-rose-600",
    glowColor: "rgba(236, 72, 153, 0.4)",
    description: "Brews highly potent dopamine focus serums, converting small steps into high level-up gold.",
    perk: "Alchemical XP Bonus",
    perkDesc: "Grants random micro-xp bonuses on task completions."
  }
];

export default function CharacterSection({ stats, onUpdateStats }: CharacterSectionProps) {
  // Use local storage to persist selected class
  const [classIndex, setClassIndex] = useState<number>(() => {
    const saved = localStorage.getItem("focus_sanctum_char_class");
    if (saved) {
      const idx = CHARACTER_CLASSES.findIndex((c) => c.id === saved);
      if (idx !== -1) return idx;
    }
    return 0;
  });

  const activeClass = CHARACTER_CLASSES[classIndex];

  useEffect(() => {
    localStorage.setItem("focus_sanctum_char_class", activeClass.id);
    if (onUpdateStats && stats.nickname) {
      // Keep character class synced in the global stats
      const classAttr = activeClass.name;
      if ((stats as any).characterClass !== classAttr) {
        onUpdateStats({
          ...stats,
          characterClass: classAttr
        } as any);
      }
    }
  }, [classIndex, activeClass]);

  const handleNextClass = () => {
    setClassIndex((prev) => (prev + 1) % CHARACTER_CLASSES.length);
  };

  const handlePrevClass = () => {
    setClassIndex((prev) => (prev - 1 + CHARACTER_CLASSES.length) % CHARACTER_CLASSES.length);
  };

  // Calculate stats based on actual user progress
  const focusMinutes = stats.totalFocusMinutes || 0;
  const completedTasks = stats.completedTasksCount || 0;
  const completedSubsteps = stats.completedSubstepsCount || 0;

  // RPG Attributes calculation
  const fortitude = Math.min(100, Math.round(15 + stats.level * 4 + focusMinutes / 12));
  const focusStamina = Math.min(100, Math.round(10 + focusMinutes * 0.8 + stats.level * 2));
  const kineticSpeed = Math.min(100, Math.round(5 + completedTasks * 6 + completedSubsteps * 2));

  return (
    <div className="bg-slate-950/80 border border-white/5 rounded-3xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-md" id="character-card-section">
      {/* Visual background glows */}
      <div 
        className="absolute w-52 h-52 rounded-full blur-3xl -top-24 -left-24 transition-all duration-1000 opacity-30" 
        style={{ backgroundColor: activeClass.id === "astral" ? "#6366f1" : activeClass.id === "hyperdrive" ? "#f59e0b" : activeClass.id === "sentinel" ? "#10b981" : "#ec4899" }}
      />
      <div 
        className="absolute w-44 h-44 rounded-full blur-3xl -bottom-20 -right-20 transition-all duration-1000 opacity-20"
        style={{ backgroundColor: activeClass.id === "astral" ? "#a855f7" : activeClass.id === "hyperdrive" ? "#ef4444" : activeClass.id === "sentinel" ? "#06b6d4" : "#f43f5e" }}
      />

      <div className="relative z-10 flex flex-col md:flex-row gap-5 items-center">
        {/* Animated Hologram Box */}
        <div className="relative w-40 h-40 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center p-4 shadow-inner group overflow-hidden shrink-0">
          {/* Diagnostic scanner grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.1)_1px,transparent_1px)] bg-[size:8px_8px] opacity-40" />
          
          {/* Animated laser horizontal scan bar */}
          <div 
            className="absolute left-0 w-full h-0.5 opacity-40 shadow-[0_0_8px_currentColor] animate-[bounce_3.5s_infinite_linear]" 
            style={{ 
              color: activeClass.id === "astral" ? "#818cf8" : activeClass.id === "hyperdrive" ? "#fbbf24" : activeClass.id === "sentinel" ? "#34d399" : "#f472b6",
              backgroundColor: "currentColor"
            }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeClass.id}
              initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: 15 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="relative w-28 h-28 flex items-center justify-center"
            >
              {/* Spinning Orbital Elements (SVGs dynamically reacting to class) */}
              <svg className="absolute w-full h-full animate-[spin_20s_infinite_linear]" viewBox="0 0 100 100">
                {activeClass.id === "astral" && (
                  <>
                    <ellipse cx="50" cy="50" rx="42" ry="12" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="5 5" className="origin-center transform rotate-45" />
                    <ellipse cx="50" cy="50" rx="42" ry="12" fill="none" stroke="#a855f7" strokeWidth="1" className="origin-center transform rotate-135" />
                    <circle cx="50" cy="50" r="4" fill="#818cf8" />
                  </>
                )}
                {activeClass.id === "hyperdrive" && (
                  <>
                    <polygon points="50,12 85,32 85,72 50,92 15,72 15,32" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="10 6" />
                    <circle cx="50" cy="50" r="15" fill="none" stroke="#f59e0b" strokeWidth="1" />
                    <line x1="50" y1="12" x2="50" y2="92" stroke="#d97706" strokeWidth="0.5" strokeDasharray="3 3" />
                  </>
                )}
                {activeClass.id === "sentinel" && (
                  <>
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="20 15" />
                    <polygon points="50,15 78,43 78,75 50,85 22,75 22,43" fill="none" stroke="#059669" strokeWidth="1" />
                    <circle cx="50" cy="50" r="6" fill="#34d399" />
                  </>
                )}
                {activeClass.id === "alchemist" && (
                  <>
                    <rect x="20" y="20" width="60" height="60" fill="none" stroke="#ec4899" strokeWidth="1.5" rx="8" strokeDasharray="8 8" className="origin-center" />
                    <circle cx="50" cy="50" r="28" fill="none" stroke="#f43f5e" strokeWidth="1" />
                    <line x1="20" y1="50" x2="80" y2="50" stroke="#db2777" strokeWidth="0.5" strokeDasharray="4 2" />
                  </>
                )}
              </svg>

              {/* Pulsing Core Sphere */}
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center bg-slate-900/90 border border-slate-700/50 shadow-inner relative z-10 transition-all duration-1000"
                style={{ boxShadow: `inset 0 0 20px ${activeClass.glowColor}` }}
              >
                <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] animate-pulse selection:bg-transparent">
                  {activeClass.emoji}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Holographic Signal Level Label */}
          <div className="absolute bottom-2 text-[8px] text-slate-500 font-extrabold tracking-widest uppercase font-mono bg-slate-950/80 px-2 py-0.5 rounded-full border border-white/5 select-none">
            SYNC: OK
          </div>
        </div>

        {/* Character Info & Selection */}
        <div className="flex-1 min-w-0 space-y-3 w-full">
          {/* Header Name & Selector */}
          <div className="flex items-center justify-between gap-1 border-b border-slate-800 pb-2.5">
            <div className="min-w-0">
              <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase font-mono block">
                Focus Champion
              </span>
              <h2 className="text-md sm:text-lg font-black text-white mt-0.5 truncate flex items-center gap-1.5 leading-none">
                {stats.nickname || "Focus Initiate"}
              </h2>
            </div>

            {/* Tactile Class Switcher */}
            <div className="flex items-center gap-1 shrink-0 bg-slate-900/60 border border-white/5 p-1 rounded-xl shadow-md">
              <button 
                onClick={handlePrevClass}
                className="p-1.5 hover:bg-slate-800 hover:text-white text-slate-400 rounded-lg transition-all cursor-pointer"
                title="Previous class"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-indigo-300 font-black uppercase font-mono px-1">
                Class
              </span>
              <button 
                onClick={handleNextClass}
                className="p-1.5 hover:bg-slate-800 hover:text-white text-slate-400 rounded-lg transition-all cursor-pointer"
                title="Next class"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Class details */}
          <div className="space-y-1.5">
            <div className={`text-xs font-black bg-gradient-to-r ${activeClass.color} bg-clip-text text-transparent flex items-center gap-1.5`}>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              {activeClass.name}
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              {activeClass.description}
            </p>
          </div>

          {/* Active Skill Perk Box */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5 shadow-inner">
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${activeClass.color} text-white shrink-0`}>
              {activeClass.id === "astral" && <Compass className="w-4 h-4" />}
              {activeClass.id === "hyperdrive" && <Zap className="w-4 h-4" />}
              {activeClass.id === "sentinel" && <Shield className="w-4 h-4" />}
              {activeClass.id === "alchemist" && <Wand2 className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black text-white leading-tight">
                Passive Perk: <span className="text-amber-300">{activeClass.perk}</span>
              </div>
              <p className="text-[9px] text-slate-400 font-medium leading-normal mt-0.5">
                {activeClass.perkDesc}
              </p>
            </div>
          </div>

          {/* Attribute Progress bars */}
          <div className="space-y-2 pt-1">
            {/* Attribute 1: Fortitude */}
            <div>
              <div className="flex justify-between text-[9px] font-bold text-slate-400 font-mono mb-1 uppercase tracking-wide">
                <span>🛡️ Fortitude</span>
                <span className="text-indigo-300">{fortitude} / 100</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
                <div 
                  className={`h-full bg-gradient-to-r ${activeClass.color} transition-all duration-1000`} 
                  style={{ width: `${fortitude}%` }} 
                />
              </div>
            </div>

            {/* Attribute 2: Focus Stamina */}
            <div>
              <div className="flex justify-between text-[9px] font-bold text-slate-400 font-mono mb-1 uppercase tracking-wide">
                <span>🔋 Focus Stamina</span>
                <span className="text-indigo-300">{focusStamina} / 100</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
                <div 
                  className={`h-full bg-gradient-to-r ${activeClass.color} transition-all duration-1000`} 
                  style={{ width: `${focusStamina}%` }} 
                />
              </div>
            </div>

            {/* Attribute 3: Kinetic Velocity */}
            <div>
              <div className="flex justify-between text-[9px] font-bold text-slate-400 font-mono mb-1 uppercase tracking-wide">
                <span>⚔️ Kinetic Velocity</span>
                <span className="text-indigo-300">{kineticSpeed} / 100</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
                <div 
                  className={`h-full bg-gradient-to-r ${activeClass.color} transition-all duration-1000`} 
                  style={{ width: `${kineticSpeed}%` }} 
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
