import { useEffect, useRef, useState } from "react";
import { Music2, Pause, Play, Shuffle } from "lucide-react";

import CenterModal from "./CenterModal.jsx";
import { AUDIO_EVENTS } from "../lib/audioEvents.js";

const BACKGROUND_KEY = "todo-app-music-background";

const TRACKS = [
  { id: "kidding-around", title: "Kidding Around", src: "/music/kidding-around.mp3" },
  { id: "playful", title: "Playful", src: "/music/playful.mp3" },
  { id: "my-little-star", title: "My Little Star", src: "/music/my-little-star.mp3" },
  { id: "forever-love", title: "Forever Love", src: "/music/forever-love.mp3" },
  { id: "playground-fun", title: "Playground Fun", src: "/music/playground-fun.mp3" },
];

function pickRandomTrack(excludeId) {
  const pool = excludeId
    ? TRACKS.filter((track) => track.id !== excludeId)
    : TRACKS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function loadBackgroundPreference() {
  try {
    return localStorage.getItem(BACKGROUND_KEY) === "true";
  } catch {
    return false;
  }
}

export default function MusicCard() {
  const audioRef = useRef(null);
  const currentTrackRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [playInBackground, setPlayInBackground] = useState(loadBackgroundPreference);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  currentTrackRef.current = currentTrack;

  const playTrack = async (track) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack?.id !== track.id) {
      audio.src = track.src;
      setCurrentTrack(track);
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const playRandomTrack = (excludeId = currentTrack?.id) => {
    const track = pickRandomTrack(excludeId);
    playTrack(track);
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack) {
      playRandomTrack();
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (!currentTrack) {
      playRandomTrack();
    }
  };

  const handleClose = () => {
    setOpen(false);
    if (!playInBackground) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    localStorage.setItem(BACKGROUND_KEY, String(playInBackground));
  }, [playInBackground]);

  useEffect(() => {
    const handleStopMusic = () => {
      audioRef.current?.pause();
      setIsPlaying(false);
    };

    window.addEventListener(AUDIO_EVENTS.STOP_MUSIC, handleStopMusic);
    return () => window.removeEventListener(AUDIO_EVENTS.STOP_MUSIC, handleStopMusic);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const handleEnded = () => {
      const track = pickRandomTrack(currentTrackRef.current?.id);
      audio.src = track.src;
      setCurrentTrack(track);
      audio.play().catch(() => setIsPlaying(false));
    };

    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
    };
  }, []);

  return (
    <div className="music-card shrink-0">
      <audio ref={audioRef} preload="none" />

      <button
        type="button"
        className={
          `music-card__trigger flex h-20 w-20 flex-col items-center justify-center rounded-xl border border-white/60 bg-white/70 text-center shadow-xl shadow-indigo-500/15 backdrop-blur-md transition hover:bg-white/90 dark:border-slate-600/60 dark:bg-slate-800/80 dark:shadow-black/30 dark:hover:bg-slate-700/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ` +
          (isPlaying ? "ring-2 ring-teal-300" : "")
        }
        aria-label="Putar musik instrumental anak secara acak"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={handleOpen}
      >
        <Music2
          className={
            `h-5 w-5 ` + (isPlaying ? "animate-pulse text-teal-500" : "text-indigo-500")
          }
          aria-hidden
        />
        <span className="mt-1 text-[10px] font-medium leading-none text-slate-500 dark:text-slate-300">
          {isPlaying ? "Playing" : "Music"}
        </span>
      </button>

      <CenterModal
        open={open}
        onClose={handleClose}
        ariaLabel="Pemutar musik instrumental anak"
        className="max-w-sm"
      >
        <div className="music-card__player text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Kids Instrumental
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-800">
            {currentTrack?.title ?? "Pilih musik"}
          </p>

          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500 text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
              aria-label={isPlaying ? "Jeda" : "Putar"}
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" aria-hidden />
              ) : (
                <Play className="h-5 w-5" aria-hidden />
              )}
            </button>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
              aria-label="Musik acak berikutnya"
              onClick={() => playRandomTrack()}
            >
              <Shuffle className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <label className="music-card__background mt-4 flex cursor-pointer items-center justify-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
              checked={playInBackground}
              onChange={(event) => setPlayInBackground(event.target.checked)}
            />
            Putar di background
          </label>

          <p className="mt-3 text-xs text-slate-400">
            Musik acak instrumental anak · Mixkit License
          </p>
        </div>
      </CenterModal>
    </div>
  );
}
