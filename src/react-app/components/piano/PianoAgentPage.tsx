// Piano practice timer. Browser mic + FFT, no ML/AI/tokens.
//
// Heuristic: piano notes produce a sharply-peaked spectrum (one or a few thin
// bright bins above a quiet floor) in the 80-2200 Hz fundamental range, with
// the peak energy >= ~4x the mean. Voice has flatter formant bands and
// silence has near-zero energy. Each 100ms tick we score "tonal? yes/no";
// when 5 of the last 8 ticks are tonal we lock onto playing.
//
// Once locked, the timer keeps running for GRACE_MS (10s) — natural pauses
// between phrases shouldn't freeze the countdown. Any piano detected during
// the grace window extends it. After 10s with no piano, the timer pauses.

import { useCallback, useEffect, useRef, useState } from "react";
import NavBar from "../NavBar";

const FFT_SIZE = 2048;
const TICK_MS = 100;
const RECENT = 8;          // sliding window length (≈ 800ms)
const NEED_TONAL = 5;      // need 5/8 tonal ticks to (re)lock onto piano
const GRACE_MS = 10_000;   // keep counting for 10s after last piano hit
const SILENCE_AVG = 6;     // below this average bin value → silence
const PEAK_TO_AVG = 4;     // peak/mean ratio that separates piano from voice
const MIN_PEAK_HZ = 80;
const MAX_PEAK_HZ = 2200;

const PRESETS = [15, 30, 45, 60];

type Status = "idle" | "playing" | "paused" | "done";

export default function PianoAgentPage() {
  const [targetMin, setTargetMin] = useState(30);
  const [remainingMs, setRemainingMs] = useState(30 * 60 * 1000);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recentRef = useRef<boolean[]>([]);
  const lastTickRef = useRef<number>(0);
  const lastPianoAtRef = useRef<number>(0);  // performance.now() of last "playing" detection

  // Reset remaining time whenever target changes (unless already running).
  useEffect(() => {
    if (!running) setRemainingMs(targetMin * 60 * 1000);
  }, [targetMin, running]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => {});
    streamRef.current = null;
    ctxRef.current = null;
    analyserRef.current = null;
    recentRef.current = [];
    lastTickRef.current = 0;
    lastPianoAtRef.current = 0;
    setRunning(false);
    setStatus((s) => (s === "done" ? "done" : "idle"));
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // Critical: keep raw signal. Echo/noise suppression eats piano too.
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.2;
      source.connect(analyser);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      recentRef.current = [];
      lastTickRef.current = 0;
      lastPianoAtRef.current = 0;
      setRunning(true);
      setStatus("paused");
    } catch {
      alert("Microphone access denied. Allow the mic and try again.");
    }
  }, []);

  // Analyze + tick. Runs on a fixed interval while the mic is open.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const analyser = analyserRef.current;
      const ctx = ctxRef.current;
      if (!analyser || !ctx) return;

      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      // Mean magnitude across all bins (0-255 each).
      let total = 0;
      for (let i = 0; i < data.length; i++) total += data[i];
      const avg = total / data.length;

      let tonal = false;
      if (avg > SILENCE_AVG) {
        // Find dominant bin. Skip the lowest few (DC + sub-bass hum).
        let maxIdx = 0;
        let maxVal = 0;
        for (let i = 4; i < data.length; i++) {
          if (data[i] > maxVal) {
            maxVal = data[i];
            maxIdx = i;
          }
        }
        const peakHz = (maxIdx * ctx.sampleRate) / FFT_SIZE;
        const ratio = maxVal / Math.max(avg, 1);
        tonal =
          peakHz >= MIN_PEAK_HZ &&
          peakHz <= MAX_PEAK_HZ &&
          ratio >= PEAK_TO_AVG;
      }

      const recent = recentRef.current;
      recent.push(tonal);
      if (recent.length > RECENT) recent.shift();
      const tonalCount = recent.reduce((n, t) => (t ? n + 1 : n), 0);

      // Lock onto piano when the sliding window confirms it. Once locked,
      // we trust the next GRACE_MS even if the kid pauses between notes.
      const now = performance.now();
      if (tonalCount >= NEED_TONAL) lastPianoAtRef.current = now;
      const inGrace = lastPianoAtRef.current > 0 && now - lastPianoAtRef.current < GRACE_MS;

      setStatus(inGrace ? "playing" : "paused");

      if (inGrace) {
        const elapsed = lastTickRef.current ? now - lastTickRef.current : TICK_MS;
        lastTickRef.current = now;
        setRemainingMs((prev) => Math.max(0, prev - elapsed));
      } else {
        lastTickRef.current = 0;
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [running]);

  // Auto-finish.
  useEffect(() => {
    if (remainingMs <= 0 && running) {
      setStatus("done");
      stop();
    }
  }, [remainingMs, running, stop]);

  // Cleanup on unmount.
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => {});
  }, []);

  const min = Math.floor(remainingMs / 60000);
  const sec = Math.floor((remainingMs % 60000) / 1000);
  const timeLabel = `${min}:${String(sec).padStart(2, "0")}`;
  const buttonClass =
    status === "playing" ? "piano-btn piano-btn-playing"
    : status === "paused" ? "piano-btn piano-btn-paused"
    : status === "done"   ? "piano-btn piano-btn-done"
    : "piano-btn";

  return (
    <div className="landing piano-page">
      <NavBar />
      <main className="piano-main">
        <h1 className="piano-title">Encourage Your Kid to Play Piano</h1>
        <p className="piano-sub">
          Set a goal. We listen for piano notes and only count down when they're actually playing.
        </p>

        <div className="piano-presets">
          <span className="piano-presets-label">Goal:</span>
          {PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setTargetMin(m)}
              disabled={running}
              className={`piano-preset ${targetMin === m ? "active" : ""}`}
            >
              {m}m
            </button>
          ))}
        </div>

        <button
          type="button"
          className={buttonClass}
          onClick={running ? stop : start}
          aria-label={running ? "Stop practice" : "Start practice"}
        >
          {status === "done" ? "🎉" : timeLabel}
        </button>

        <p className="piano-status">
          {!running && status !== "done" && "Tap the timer to start"}
          {!running && status === "done" && "Done — great practice!"}
          {running && status === "playing" && "🎹 Playing — keep going!"}
          {running && status === "paused" && "🤫 Listening — play something on the piano"}
        </p>
      </main>
    </div>
  );
}
