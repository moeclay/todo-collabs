import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";

import CenterModal from "./CenterModal.jsx";
import { stopMusic } from "../lib/audioEvents.js";

const BACKGROUND_KEY = "todo-app-pomodoro-background";
const PRESET_KEY = "todo-app-pomodoro-preset";
const CUSTOM_MINUTES_KEY = "todo-app-pomodoro-custom-minutes";
const BREAK_MS = 5 * 60 * 1000;
const ALARM_SRC = "/sounds/alarm.mp3";

const DURATION_PRESETS = {
  "25": { label: "25 menit", minutes: 25 },
  "60": { label: "1 jam", minutes: 60 },
  custom: { label: "Custom", minutes: null },
};

function loadBackgroundPreference() {
  try {
    return localStorage.getItem(BACKGROUND_KEY) === "true";
  } catch {
    return false;
  }
}

function loadPreset() {
  try {
    const value = localStorage.getItem(PRESET_KEY);
    return value && DURATION_PRESETS[value] ? value : "25";
  } catch {
    return "25";
  }
}

function loadCustomMinutes() {
  try {
    const value = Number(localStorage.getItem(CUSTOM_MINUTES_KEY));
    if (!Number.isFinite(value)) return 30;
    return Math.min(180, Math.max(1, Math.round(value)));
  } catch {
    return 30;
  }
}

function clampCustomMinutes(value) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes)) return 30;
  return Math.min(180, Math.max(1, Math.round(minutes)));
}

function formatMs(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function PomodoroCard() {
  const alarmRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [runInBackground, setRunInBackground] = useState(loadBackgroundPreference);
  const [durationPreset, setDurationPreset] = useState(loadPreset);
  const [customMinutes, setCustomMinutes] = useState(loadCustomMinutes);
  const [phase, setPhase] = useState("work");
  const [status, setStatus] = useState("idle");
  const [endsAt, setEndsAt] = useState(null);
  const [pausedMs, setPausedMs] = useState(null);
  const [, setTick] = useState(0);

  const getWorkDurationMs = useCallback(() => {
    if (durationPreset === "custom") {
      return clampCustomMinutes(customMinutes) * 60 * 1000;
    }
    return DURATION_PRESETS[durationPreset].minutes * 60 * 1000;
  }, [durationPreset, customMinutes]);

  const getDurationMs = useCallback(
    (targetPhase = phase) =>
      targetPhase === "work" ? getWorkDurationMs() : BREAK_MS,
    [phase, getWorkDurationMs],
  );

  const remainingMs =
    status === "paused" && pausedMs != null
      ? pausedMs
      : status === "running" && endsAt != null
        ? Math.max(0, endsAt - Date.now())
        : getDurationMs();

  const isRunning = status === "running";
  const isAlarm = status === "alarm";
  const canEditSettings = !isRunning && !isAlarm;

  const stopAlarm = useCallback(() => {
    const alarm = alarmRef.current;
    if (alarm) {
      alarm.pause();
      alarm.currentTime = 0;
      alarm.loop = false;
    }
    setStatus("idle");
    setPhase((current) => (current === "work" ? "break" : "work"));
    setEndsAt(null);
    setPausedMs(null);
  }, []);

  const triggerAlarm = useCallback(() => {
    stopMusic();
    setStatus("alarm");
    setEndsAt(null);
    setPausedMs(null);

    const alarm = alarmRef.current;
    if (!alarm) return;

    alarm.loop = true;
    alarm.play().catch(() => {});
  }, []);

  const startTimer = () => {
    const duration =
      status === "paused" && pausedMs != null ? pausedMs : getDurationMs();
    setEndsAt(Date.now() + duration);
    setPausedMs(null);
    setStatus("running");
  };

  const pauseTimer = () => {
    if (!endsAt) return;
    setPausedMs(Math.max(0, endsAt - Date.now()));
    setEndsAt(null);
    setStatus("paused");
  };

  const resetTimer = () => {
    const alarm = alarmRef.current;
    if (alarm) {
      alarm.pause();
      alarm.currentTime = 0;
      alarm.loop = false;
    }
    setStatus("idle");
    setEndsAt(null);
    setPausedMs(null);
  };

  const handleClose = () => {
    setOpen(false);
    if (!runInBackground && isRunning) {
      pauseTimer();
    }
  };

  const handlePresetChange = (preset) => {
    if (!canEditSettings || phase !== "work") return;
    setDurationPreset(preset);
    resetTimer();
  };

  const handlePhaseChange = (nextPhase) => {
    if (!canEditSettings) return;
    setPhase(nextPhase);
    resetTimer();
  };

  useEffect(() => {
    localStorage.setItem(BACKGROUND_KEY, String(runInBackground));
  }, [runInBackground]);

  useEffect(() => {
    localStorage.setItem(PRESET_KEY, durationPreset);
  }, [durationPreset]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_MINUTES_KEY, String(clampCustomMinutes(customMinutes)));
  }, [customMinutes]);

  useEffect(() => {
    if (!isRunning || !endsAt) return undefined;

    const intervalId = setInterval(() => {
      if (Date.now() >= endsAt) {
        triggerAlarm();
        return;
      }
      setTick((value) => value + 1);
    }, 250);

    return () => clearInterval(intervalId);
  }, [isRunning, endsAt, triggerAlarm]);

  useEffect(
    () => () => {
      alarmRef.current?.pause();
    },
    [],
  );

  const phaseLabel = phase === "work" ? "Fokus" : "Istirahat";
  const durationHint =
    phase === "work"
      ? durationPreset === "custom"
        ? `${clampCustomMinutes(customMinutes)} menit`
        : DURATION_PRESETS[durationPreset].label
      : "5 menit";

  return (
    <div className="pomodoro-card shrink-0">
      <audio ref={alarmRef} src={ALARM_SRC} preload="auto" />

      <button
        type="button"
        className={
          `pomodoro-card__trigger flex h-20 w-20 flex-col items-center justify-center rounded-xl border border-white/60 bg-white/70 text-center shadow-xl shadow-indigo-500/15 backdrop-blur-md transition hover:bg-white/90 dark:border-slate-600/60 dark:bg-slate-800/80 dark:shadow-black/30 dark:hover:bg-slate-700/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ` +
          (isRunning ? "ring-2 ring-rose-300" : "") +
          (isAlarm ? "animate-pulse ring-2 ring-rose-500" : "")
        }
        aria-label={`Pomodoro ${phaseLabel}, ${formatMs(remainingMs)} tersisa`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Timer
          className={
            `h-5 w-5 ` +
            (isAlarm
              ? "text-rose-500"
              : isRunning
                ? "text-rose-400"
                : "text-indigo-500")
          }
          aria-hidden
        />
        <span className="mt-1 text-sm font-bold leading-none text-slate-800 dark:text-slate-100">
          {formatMs(remainingMs)}
        </span>
        <span className="mt-0.5 text-[10px] font-medium leading-none text-slate-500 dark:text-slate-300">
          {phaseLabel}
        </span>
      </button>

      <CenterModal
        open={open}
        onClose={handleClose}
        ariaLabel="Timer Pomodoro"
        className="max-w-sm"
      >
        <div className="pomodoro-card__panel text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pomodoro
          </p>
          <p className="mt-1 text-sm font-medium text-indigo-600">
            {phaseLabel} · {durationHint}
          </p>
          <p className="mt-3 font-mono text-5xl font-bold tracking-tight text-slate-800">
            {formatMs(remainingMs)}
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            {isRunning ? (
              <button
                type="button"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white shadow-md shadow-rose-500/25 transition hover:bg-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
                aria-label="Jeda"
                onClick={pauseTimer}
              >
                <Pause className="h-5 w-5" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500 text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
                aria-label="Mulai"
                onClick={startTimer}
                disabled={isAlarm}
              >
                <Play className="h-5 w-5" aria-hidden />
              </button>
            )}

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
              aria-label="Reset timer"
              onClick={resetTimer}
              disabled={isAlarm}
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              className={
                `rounded-lg px-3 py-1.5 text-xs font-medium transition ` +
                (phase === "work"
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200")
              }
              disabled={!canEditSettings}
              onClick={() => handlePhaseChange("work")}
            >
              Fokus
            </button>
            <button
              type="button"
              className={
                `rounded-lg px-3 py-1.5 text-xs font-medium transition ` +
                (phase === "break"
                  ? "bg-teal-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200")
              }
              disabled={!canEditSettings}
              onClick={() => handlePhaseChange("break")}
            >
              Istirahat 5m
            </button>
          </div>

          {phase === "work" && (
            <div className="pomodoro-card__presets mt-4 text-left">
              <p className="mb-2 text-center text-xs font-medium text-slate-500">
                Durasi fokus
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {Object.entries(DURATION_PRESETS).map(([id, preset]) => (
                  <button
                    key={id}
                    type="button"
                    className={
                      `rounded-lg px-3 py-1.5 text-xs font-medium transition ` +
                      (durationPreset === id
                        ? "bg-indigo-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                    }
                    disabled={!canEditSettings}
                    onClick={() => handlePresetChange(id)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {durationPreset === "custom" && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    className="w-20 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-center text-sm text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/35"
                    value={customMinutes}
                    disabled={!canEditSettings}
                    aria-label="Durasi custom dalam menit"
                    onChange={(event) => {
                      setCustomMinutes(clampCustomMinutes(event.target.value));
                      resetTimer();
                    }}
                  />
                  <span className="text-sm text-slate-500">menit</span>
                </div>
              )}
            </div>
          )}

          <label className="pomodoro-card__background mt-4 flex cursor-pointer items-center justify-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
              checked={runInBackground}
              onChange={(event) => setRunInBackground(event.target.checked)}
            />
            Jalankan di background
          </label>
        </div>
      </CenterModal>

      {isAlarm &&
        createPortal(
          <div className="pomodoro-card__alarm fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-rose-200 bg-white p-6 text-center shadow-2xl shadow-rose-500/20">
              <p className="text-lg font-semibold text-rose-600">Waktu habis!</p>
              <p className="mt-2 text-sm text-slate-600">
                {phase === "work"
                  ? "Sesi fokus selesai. Saatnya istirahat."
                  : "Istirahat selesai. Siap fokus lagi?"}
              </p>
              <button
                type="button"
                className="mt-6 w-full rounded-lg bg-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-rose-500/25 transition hover:bg-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
                onClick={stopAlarm}
              >
                Stop
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
