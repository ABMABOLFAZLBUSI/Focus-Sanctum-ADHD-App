/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Award, Flame, Zap, Trophy, TrendingUp, CheckCircle, Clock, ListChecks } from "lucide-react";
import { UserStats, DailyQuest } from "../types";
import { motion } from "motion/react";
import CharacterSection from "./CharacterSection";

interface StatsDashboardProps {
  stats: UserStats;
  quests: DailyQuest[];
  onClaimQuestXp: (questId: string, xpReward: number) => void;
  onUpdateStats?: (newStats: UserStats) => void;
}

export function getRank(level: number): string {
  if (level >= 25) return "RANK SSS";
  if (level >= 20) return "RANK SS";
  if (level >= 15) return "RANK S";
  if (level >= 10) return "RANK A";
  if (level >= 6) return "RANK B";
  if (level >= 3) return "RANK C";
  return "RANK D";
}

export default function StatsDashboard({ stats, quests, onClaimQuestXp, onUpdateStats }: StatsDashboardProps) {
  const xpPercentage = Math.min((stats.xp / stats.xpToNextLevel) * 100, 100);

  return (
    <div className="space-y-4" id="stats-dashboard-container">
      {/* Interactive RPG Character Section */}
      <CharacterSection stats={stats} onUpdateStats={onUpdateStats} />

      {/* Level & XP progression banner */}
      <div className="bg-slate-950/80 border border-white/5 rounded-2xl p-5 text-white shadow-2xl relative overflow-hidden backdrop-blur-md">
        {/* Glow Effects */}
        <div className="absolute -right-10 -top-10 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl border border-indigo-500/25 flex items-center justify-center shadow-lg shrink-0" title="Current Level">
              <span className="text-2xl font-black font-mono text-amber-300">
                {stats.level}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-black tracking-tight text-white uppercase truncate">Focus Mastery</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium truncate">
                {stats.xpToNextLevel - stats.xp} XP to next level
              </p>
            </div>
          </div>

          {/* Symmetrical Rank Box - Matches Level box size (w-14 h-14) */}
          <div className="w-14 h-14 bg-indigo-500/15 rounded-2xl border border-indigo-500/30 flex flex-col items-center justify-center shadow-lg shrink-0 ml-3 text-center" title="Character Rank">
            <span className="text-[8px] text-indigo-400 font-black tracking-widest leading-none mb-1">RANK</span>
            <span className="text-sm font-black font-mono leading-none text-indigo-300">
              {getRank(stats.level).replace("RANK ", "")}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 font-mono">
            <span>{stats.xp} XP</span>
            <span>{stats.xpToNextLevel} XP MAX</span>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)]"
            />
          </div>
        </div>
      </div>

      {/* Quests (Clear short-term actions) */}
      <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-2xl p-4 shadow-xl">
        <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase mb-3 flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-500" /> Today's Focus Quests
        </h3>

        <div className="space-y-2.5">
          {quests.map((quest) => {
            const isCompleted = quest.current >= quest.target;
            const percentage = Math.min((quest.current / quest.target) * 100, 100);

            return (
              <div
                key={quest.id}
                className={`p-3 rounded-xl border transition-all ${
                  isCompleted
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-xs sm:text-sm font-bold text-white leading-tight ${
                      isCompleted ? "line-through text-slate-500 font-medium" : ""
                    }`}>
                      {quest.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold font-mono mt-1">
                      Progress: {quest.current} / {quest.target}
                    </p>
                  </div>

                  <div className="ml-3">
                    {isCompleted ? (
                      <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 stroke-[2.5px]" /> +{quest.xpReward} XP
                      </span>
                    ) : (
                      <span className="text-[9px] font-extrabold text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
                        +{quest.xpReward} XP
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar micro */}
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-2 border border-slate-900">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isCompleted ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Symmetrical Stats Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-2xl p-3.5 text-center shadow-xl">
          <div className="p-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl w-fit mx-auto mb-2">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-lg font-black font-mono text-white">{stats.totalFocusMinutes}m</div>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Focused</span>
        </div>

        <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-2xl p-3.5 text-center shadow-xl">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl w-fit mx-auto mb-2">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="text-lg font-black font-mono text-white">{stats.completedTasksCount}</div>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Tasks Done</span>
        </div>

        <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-2xl p-3.5 text-center shadow-xl">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl w-fit mx-auto mb-2">
            <ListChecks className="w-4 h-4" />
          </div>
          <div className="text-lg font-black font-mono text-white">{stats.completedSubstepsCount}</div>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Steps Done</span>
        </div>
      </div>
    </div>
  );
}
