/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, CupSoda, Flame, Smile, Wind, Trees, MessageCircle, Play, CheckCircle, X, Clock } from "lucide-react";
import { DopaItem } from "../types";
import { audioEngine } from "../utils/AudioEngine";
import { motion, AnimatePresence } from "motion/react";

interface DopamineMenuProps {
  onAddXp: (amount: number) => void;
}

const DEFAULT_DOPA_ITEMS: DopaItem[] = [
  {
    id: "dopa-1",
    title: "Drink a cold glass of water",
    durationMinutes: 1,
    icon: "CupSoda",
    category: "body",
    xpReward: 15,
  },
  {
    id: "dopa-2",
    title: "10 Jumping jacks / quick stretch",
    durationMinutes: 2,
    icon: "Flame",
    category: "body",
    xpReward: 25,
  },
  {
    id: "dopa-3",
    title: "Take 5 deep diaphragmatic breaths",
    durationMinutes: 1,
    icon: "Wind",
    category: "mind",
    xpReward: 15,
  },
  {
    id: "dopa-4",
    title: "Write down 3 things you appreciate",
    durationMinutes: 3,
    icon: "Smile",
    category: "mind",
    xpReward: 30,
  },
  {
    id: "dopa-5",
    title: "Step outside and look at the sky",
    durationMinutes: 4,
    icon: "Trees",
    category: "nature",
    xpReward: 40,
  },
  {
    id: "dopa-6",
    title: "Send a sweet text to a friend",
    durationMinutes: 2,
    icon: "MessageCircle",
    category: "social",
    xpReward: 25,
  },
];

const categoryColors = {
  body: { bg: "bg-orange-500/10 text-orange-400 border-orange-500/20", accent: "orange" },
  mind: { bg: "bg-blue-500/10 text-blue-400 border-blue-500/20", accent: "blue" },
  nature: { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", accent: "emerald" },
  social: { bg: "bg-pink-500/10 text-pink-400 border-pink-500/20", accent: "pink" },
};

const getIconComponent = (name: string) => {
  switch (name) {
    case "CupSoda": return <CupSoda className="w-5 h-5" />;
    case "Flame": return <Flame className="w-5 h-5" />;
    case "Wind": return <Wind className="w-5 h-5" />;
    case "Smile": return <Smile className="w-5 h-5" />;
    case "Trees": return <Trees className="w-5 h-5" />;
    case "MessageCircle": return <MessageCircle className="w-5 h-5" />;
    default: return <Sparkles className="w-5 h-5" />;
  }
};

export default function DopamineMenu({ onAddXp }: DopamineMenuProps) {
  const [activeItem, setActiveItem] = useState<DopaItem | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      timerId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      handleComplete();
    }
    return () => clearInterval(timerId);
  }, [isRunning, timeLeft]);

  const handleStart = (item: DopaItem) => {
    setActiveItem(item);
    setTimeLeft(item.durationMinutes * 60);
    setIsRunning(true);
    setShowCelebration(false);
  };

  const handleCancel = () => {
    setIsRunning(false);
    setActiveItem(null);
  };

  const handleComplete = () => {
    setIsRunning(false);
    if (activeItem) {
      audioEngine.playTaskComplete();
      onAddXp(activeItem.xpReward);
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        setActiveItem(null);
      }, 3000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="bg-[#0f162a] border border-white/5 backdrop-blur-md rounded-2xl p-5 shadow-xl" id="dopa-menu-container">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-md font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400/20" />
            Healthy Dopamine Menu
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ditch doomscrolling. Re-energize with quick, healthy focus actions!
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeItem ? (
          <motion.div
            key="active-timer"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-6 rounded-xl border ${categoryColors[activeItem.category].bg} flex flex-col items-center text-center`}
          >
            {showCelebration ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-4"
              >
                <CheckCircle className="w-16 h-16 mx-auto mb-3 stroke-[2.5px] text-emerald-400 animate-bounce" />
                <h3 className="text-lg font-black text-white">Energized!</h3>
                <p className="text-sm font-bold text-emerald-400 mt-1">+{activeItem.xpReward} XP Earned</p>
              </motion.div>
            ) : (
              <>
                <div className="p-3 bg-slate-950 rounded-full shadow-sm mb-3 text-slate-300 animate-pulse border border-slate-800">
                  {getIconComponent(activeItem.icon)}
                </div>
                <h3 className="font-bold text-white text-md px-2">{activeItem.title}</h3>
                
                <div className="text-3xl font-mono font-black text-white tracking-wider my-4">
                  {formatTime(timeLeft)}
                </div>

                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mb-5 border border-slate-800">
                  <div
                    className={`h-full bg-indigo-500 transition-all duration-1000`}
                    style={{ width: `${(timeLeft / (activeItem.durationMinutes * 60)) * 100}%` }}
                  />
                </div>

                <div className="flex gap-2 w-full justify-center">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/40 hover:bg-slate-700/40 text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center gap-1.5"
                    id="dopa-cancel-btn"
                  >
                    <X className="w-3.5 h-3.5" /> Skip
                  </button>
                  <button
                    onClick={handleComplete}
                    className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-xs font-black uppercase tracking-wider text-white transition-all flex items-center gap-1.5 shadow-[0_4px_15px_rgba(99,102,241,0.2)]"
                    id="dopa-complete-btn"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Done Early
                  </button>
                </div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {DEFAULT_DOPA_ITEMS.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleStart(item)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer hover:shadow-md transition-all ${
                  categoryColors[item.category].bg
                }`}
                id={`dopa-item-${item.id}`}
              >
                <div className="p-2 bg-slate-950 rounded-lg shadow-2xs mt-0.5">
                  {getIconComponent(item.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-100 text-xs sm:text-sm leading-tight truncate">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-bold font-mono">
                    <span className="flex items-center gap-0.5 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {item.durationMinutes}m
                    </span>
                    <span className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      +{item.xpReward} XP
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
