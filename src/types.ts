/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SubStep {
  id: string;
  title: string;
  completed: boolean;
}

export type EnergyLevel = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  energyLevel: EnergyLevel;
  estimatedMinutes: number;
  substeps: SubStep[];
  createdAt: string;
  completedAt?: string;
  pomodoros: number; // Focus sessions completed for this task
  category?: string;
}

export interface Note {
  id: string;
  content: string;
  category: string; // e.g., "Idea", "Reflection", "Reminder", "Emotion"
  createdAt: string;
}

export interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  lastActiveDate: string | null; // For checking streaks
  totalFocusMinutes: number;
  completedTasksCount: number;
  completedSubstepsCount: number;
  nickname?: string;
}

export interface DopaItem {
  id: string;
  title: string;
  durationMinutes: number;
  icon: string; // Lucide icon name
  category: "body" | "mind" | "social" | "nature";
  xpReward: number;
}

export interface DailyQuest {
  id: string;
  title: string;
  target: number;
  current: number;
  completed: boolean;
  xpReward: number;
  type: "tasks" | "substeps" | "focus" | "braindump";
}
