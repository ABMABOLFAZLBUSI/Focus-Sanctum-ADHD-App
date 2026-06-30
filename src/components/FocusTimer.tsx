/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Flame, Brain, Timer, Zap, Sparkles, CheckCircle } from "lucide-react";
import { audioEngine } from "../utils/AudioEngine";
import { motion, AnimatePresence } from "motion/react";

interface FocusTimerProps {
  onAddFocusMinutes: (minutes: number) => void;
  onAddXp: (amount: number) => void;
  selectedTaskTitle?: string;
}

const PRESET_MINUTES = [5, 10, 15, 25];

export default function FocusTimer({ onAddFocusMinutes, onAddXp, selectedTaskTitle }: FocusTimerProps) {
  const [duration, setDuration] = useState<number>(15 * 60); // Default 15 mins in seconds
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [noiseType, setNoiseType] = useState<"none" | "brown" | "white" | "cosmic" | "binaural">("none");
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [gainedXp, setGainedXp] = useState<number>(0);

  // Custom mode state
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customMinutes, setCustomMinutes] = useState<string>("30");

  // Dynamic noise volume state
  const [volume, setVolume] = useState<number>(audioEngine.getVolume());

  const initialDurationRef = useRef<number>(15 * 60);

  // Sync preset changes
  const handleSelectPreset = (minutes: number) => {
    if (isRunning) return;
    setIsCustomMode(false);
    const secs = minutes * 60;
    setDuration(secs);
    setTimeLeft(secs);
    initialDurationRef.current = secs;
  };

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

  // Keep ambient sound in sync with timer state
  useEffect(() => {
    if (isRunning && noiseType !== "none") {
      audioEngine.startNoise(noiseType);
    } else {
      audioEngine.stopNoise();
    }
    return () => {
      audioEngine.stopNoise();
    };
  }, [isRunning, noiseType]);

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration);
    audioEngine.stopNoise();
  };

  const handleComplete = () => {
    setIsRunning(false);
    audioEngine.stopNoise();
    audioEngine.playTimerComplete();

    const completedMins = Math.round(duration / 60);
    const xp = completedMins * 10; // +10 XP per focus minute!

    onAddFocusMinutes(completedMins);
    onAddXp(xp);
    setGainedXp(xp);
    setShowCelebration(true);

    setTimeout(() => {
      setShowCelebration(false);
      setTimeLeft(duration);
    }, 4000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const percentProgress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-2xl p-5 shadow-xl flex flex-col items-center text-center" id="focus-timer-container">
      <div className="w-full flex items-center justify-between mb-4">
        <div className="text-left">
          <h2 className="text-md font-bold text-white tracking-tight flex items-center gap-1.5">
            <Timer className="w-5 h-5 text-indigo-400" />
            Hyperfocus Companion
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Short, focused bursts. Choose a preset to start instantly!
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showCelebration ? (
          <motion.div
            key="celebration"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="py-12 px-6 bg-indigo-500/10 border border-indigo-400/20 rounded-2xl w-full flex flex-col items-center"
          >
            <Sparkles className="w-16 h-16 text-indigo-400 fill-indigo-400/20 animate-bounce mb-3" />
            <h3 className="text-lg font-black text-white">Brilliant Focus Session!</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed font-medium">
              You did it! Your brain successfully stayed on track. Celebrate this win!
            </p>
            <span className="text-indigo-400 font-extrabold text-sm mt-4 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              +{gainedXp} XP Boost
            </span>
          </motion.div>
        ) : (
          <motion.div key="timer-active" className="w-full flex flex-col items-center">
            {/* Task Context */}
            {selectedTaskTitle && (
              <div className="bg-indigo-500/10 text-indigo-300 px-3.5 py-1.5 rounded-full text-xs font-bold border border-indigo-400/20 mb-5 max-w-full truncate flex items-center gap-1.5 shadow-[0_0_15px_rgba(99,102,241,0.05)]">
                <Brain className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                Focusing on: <span className="underline font-extrabold">{selectedTaskTitle}</span>
              </div>
            )}

            {/* Circular Progress & Time Dial */}
            <div className="relative w-44 h-44 flex items-center justify-center my-2">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r="76"
                  className="stroke-slate-800/80 fill-transparent"
                  strokeWidth="8"
                />
                <circle
                  cx="88"
                  cy="88"
                  r="76"
                  className="stroke-indigo-400 fill-transparent transition-all duration-300"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 76}
                  strokeDashoffset={2 * Math.PI * 76 * (1 - percentProgress / 100)}
                  strokeLinecap="round"
                  style={{ filter: "drop-shadow(0 0 8px rgba(129,140,248,0.5))" }}
                />
              </svg>

              <div className="text-center z-10">
                <div className="text-4xl font-mono font-black text-white tracking-wider">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-1">
                  {isRunning ? "DOING GREAT" : "READY"}
                </div>
              </div>
            </div>

            {/* Presets - Only interactive when not running */}
            <div className="flex gap-2.5 my-5 justify-center items-center">
              {PRESET_MINUTES.map((mins) => (
                <button
                  key={mins}
                  disabled={isRunning}
                  onClick={() => handleSelectPreset(mins)}
                  className={`w-11 h-11 text-xs font-bold rounded-xl border transition-all ${
                    !isCustomMode && duration === mins * 60
                      ? "bg-indigo-500 text-white border-transparent shadow-[0_4px_15px_rgba(99,102,241,0.3)]"
                      : "bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:bg-slate-700/40 hover:text-white disabled:opacity-50"
                  }`}
                  id={`preset-${mins}`}
                >
                  {mins}m
                </button>
              ))}
              <button
                disabled={isRunning}
                onClick={() => {
                  setIsCustomMode(!isCustomMode);
                  if (!isCustomMode) {
                    const mins = parseInt(customMinutes, 10) || 30;
                    setDuration(mins * 60);
                    setTimeLeft(mins * 60);
                  }
                }}
                className={`px-3 h-11 text-xs font-bold rounded-xl border transition-all ${
                  isCustomMode
                    ? "bg-indigo-500 text-white border-transparent shadow-[0_4px_15px_rgba(99,102,241,0.3)]"
                    : "bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:bg-slate-700/40 hover:text-white disabled:opacity-50"
                }`}
                id="btn-custom-timer"
              >
                Custom
              </button>
            </div>

            {/* Custom Minutes Input */}
            {isCustomMode && !isRunning && (
              <div className="flex items-center gap-2.5 mb-5 bg-slate-950/40 border border-white/5 px-3 py-1.5 rounded-xl animate-fade-in">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Minutes:</span>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customMinutes}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomMinutes(val);
                    const mins = parseInt(val, 10);
                    if (!isNaN(mins) && mins > 0) {
                      const secs = mins * 60;
                      setDuration(secs);
                      setTimeLeft(secs);
                      initialDurationRef.current = secs;
                    }
                  }}
                  className="w-16 px-2 py-1 bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-lg text-xs font-black text-indigo-300 font-mono text-center focus:outline-none"
                  placeholder="30"
                />
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-4 justify-center">
              <button
                onClick={handleReset}
                className="p-3 bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
                title="Reset timer"
                id="timer-reset"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={handleToggleTimer}
                className={`p-4 rounded-2xl text-white transition-all shadow-md cursor-pointer ${
                  isRunning
                    ? "bg-slate-800 hover:bg-slate-700 shadow-[0_4px_15px_rgba(0,0,0,0.3)]"
                    : "bg-indigo-500 hover:bg-indigo-600 shadow-[0_10px_30px_rgba(99,102,241,0.4)]"
                }`}
                id="timer-play-pause"
              >
                {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 fill-white stroke-none" />}
              </button>

              <div className="w-11 h-11 flex items-center justify-center">
                {timeLeft < duration ? (
                  <button
                    onClick={handleComplete}
                    className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25 rounded-xl transition-all cursor-pointer animate-fade-in"
                    title="Complete session early"
                    id="timer-skip-complete"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="w-11 h-11" />
                )}
              </div>
            </div>

            {/* Ambient Focus Sounds Selector */}
            <div className="w-full mt-6 border-t border-slate-800/80 pt-4 flex flex-col items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1">
                {noiseType !== "none" ? (
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                )}
                ADHD Ambient Focus Sound
              </label>
              
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                {[
                  { value: "none", label: "🔇 Silence" },
                  { value: "brown", label: "🟫 Brown Noise" },
                  { value: "cosmic", label: "🌌 Cosmic Hum" },
                  { value: "binaural", label: "🧠 Binaural Beat" },
                ].map((sound) => (
                  <button
                    key={sound.value}
                    onClick={() => setNoiseType(sound.value as any)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left transition-all cursor-pointer ${
                      noiseType === sound.value
                        ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-bold shadow-[0_0_10px_rgba(99,102,241,0.1)]"
                        : "bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-700/40 hover:text-white"
                    }`}
                  >
                    {sound.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Sound Volume Slider */}
              {noiseType !== "none" && (
                <div className="w-full mt-3.5 max-w-sm px-3 py-2 bg-slate-950/50 border border-white/5 rounded-xl flex items-center gap-3 animate-fade-in">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase shrink-0 font-mono">VOL: {Math.round(volume * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={volume}
                    onChange={(e) => {
                      const newVol = parseFloat(e.target.value);
                      setVolume(newVol);
                      audioEngine.setVolume(newVol);
                    }}
                    className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                    title="Adjust ambient sound level"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
