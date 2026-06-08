// Piano practice game for kids. Browser mic + FFT, no ML/AI/tokens.
//
// Detection (the hard part — voice and piano both have spectral peaks):
//   1. Energy floor (filters silence).
//   2. Dominant peak in 80-2200 Hz (piano fundamental range).
//   3. Peak/mean ratio ≥ 5  (sharper than voice formants).
//   4. Harmonic check: a peak at bin K must have meaningful energy at 2K
//      (piano has strong integer harmonics; voice formants are not at
//       integer multiples).
//   5. **Pitch stability**: 2+ consecutive ticks share the same peak bin
//      (±2 bins). Voice formants jump around every ~100ms; piano notes
//      hold steady. This is the main voice-vs-piano discriminator.
//
// Once we lock onto piano, the timer keeps counting for GRACE_MS (10s);
// any further piano hit extends it. Only real silence pauses the timer.
//
// Gamification:
//   - Pet emoji grows based on LIFETIME minutes played (localStorage).
//   - Per-session stats: notes played, concentration %, pause count.
//   - End-of-session star rating (1-5) based on concentration + pauses.
//   - Recent notes flow next to the pet so the kid sees feedback per note.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NavBar from "../NavBar";

/* ── Tunables ──────────────────────────────────────────────── */

const FFT_SIZE = 2048;
const TICK_MS = 100;
const STABILITY_WINDOW = 6;     // last ~600ms of peak history
const GRACE_MS = 10_000;        // timer keeps running 10s after last piano hit
const SILENCE_AVG = 6;
const PEAK_TO_AVG = 5;
const HARMONIC_RATIO = 0.10;
const PEAK_BIN_TOLERANCE = 2;   // ±2 FFT bins counts as "same note"
const NEW_NOTE_GAP_MS = 700;    // repeating same note after this gap = new note

const MIN_PEAK_HZ = 80;
const MAX_PEAK_HZ = 2200;

const PRESETS = [15, 30, 45, 60];

/* ── Pet stages (cumulative lifetime minutes) ──────────────── */

const PET_STAGES = [
  { min: 0,    emoji: "🥚",  label: "Sleepy Egg",    msg: "Play to hatch your pet!" },
  { min: 5,    emoji: "🐣",  label: "Hatchling",     msg: "Hi! I just hatched!" },
  { min: 15,   emoji: "🐥",  label: "Little Chick",  msg: "Cheep cheep!" },
  { min: 30,   emoji: "🐤",  label: "Happy Chick",   msg: "I love your music!" },
  { min: 60,   emoji: "🦆",  label: "Duckling",      msg: "Quack! Keep playing!" },
  { min: 120,  emoji: "🦜",  label: "Bright Parrot", msg: "I can almost talk now!" },
  { min: 240,  emoji: "🦅",  label: "Soaring Eagle", msg: "Take me higher!" },
  { min: 480,  emoji: "🦄",  label: "Magical Unicorn", msg: "Your music is magic!" },
  { min: 960,  emoji: "🐉",  label: "Mighty Dragon", msg: "ROAR! Maestro!" },
];

function petStageFor(totalMin: number) {
  let stage = PET_STAGES[0];
  let level = 1;
  for (let i = 0; i < PET_STAGES.length; i++) {
    if (totalMin >= PET_STAGES[i].min) { stage = PET_STAGES[i]; level = i + 1; }
  }
  const next = PET_STAGES.find((s) => s.min > totalMin);
  return { stage, level, next };
}

/* ── Helpers ───────────────────────────────────────────────── */

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function hzToNote(hz: number): string {
  if (hz < 20) return "";
  const midi = Math.round(12 * Math.log2(hz / 440) + 69);
  if (midi < 0 || midi > 127) return "";
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

function calcStars(playingMs: number, totalMs: number, pauseEvents: number): number {
  if (totalMs < 1000) return 0;
  const conc = playingMs / totalMs;
  let stars = 1;
  if (conc > 0.30) stars = 2;
  if (conc > 0.50) stars = 3;
  if (conc > 0.70) stars = 4;
  if (conc > 0.85) stars = 5;
  // Penalty: too many breaks knocks off a star (min 1).
  if (pauseEvents > 4 && stars > 1) stars -= 1;
  return stars;
}

/* ── Lifetime stats in localStorage ────────────────────────── */

interface Lifetime { totalMin: number; totalNotes: number; sessions: number; bestStars: number; }
const LS_KEY = "piano_lifetime_v1";

function loadLifetime(): Lifetime {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        totalMin: Number(parsed.totalMin) || 0,
        totalNotes: Number(parsed.totalNotes) || 0,
        sessions: Number(parsed.sessions) || 0,
        bestStars: Number(parsed.bestStars) || 0,
      };
    }
  } catch { /* ignore */ }
  return { totalMin: 0, totalNotes: 0, sessions: 0, bestStars: 0 };
}
function saveLifetime(l: Lifetime) {
  localStorage.setItem(LS_KEY, JSON.stringify(l));
}

/* ── Detection (pure function) ─────────────────────────────── */

// Returns the FFT peak bin if this tick looks like a piano note, else -1.
function pianoPeakBin(data: Uint8Array, sampleRate: number): number {
  let total = 0;
  for (let i = 0; i < data.length; i++) total += data[i];
  const avg = total / data.length;
  if (avg < SILENCE_AVG) return -1;

  const minBin = Math.floor((MIN_PEAK_HZ * FFT_SIZE) / sampleRate);
  const maxBin = Math.min(data.length - 1, Math.floor((MAX_PEAK_HZ * FFT_SIZE) / sampleRate));
  let maxIdx = -1, maxVal = 0;
  for (let i = Math.max(4, minBin); i <= maxBin; i++) {
    if (data[i] > maxVal) { maxVal = data[i]; maxIdx = i; }
  }
  if (maxIdx === -1) return -1;
  if (maxVal / Math.max(avg, 1) < PEAK_TO_AVG) return -1;

  // Harmonic check: bin 2*K should have meaningful energy (piano has strong
  // integer harmonics). Filters voice formants which sit at non-harmonic spots.
  const h2 = maxIdx * 2 < data.length ? data[maxIdx * 2] : 0;
  if (h2 < maxVal * HARMONIC_RATIO) return -1;

  return maxIdx;
}

/* ── Component ─────────────────────────────────────────────── */

type Status = "idle" | "playing" | "paused" | "done";

interface SessionStats {
  startedAt: number;
  notes: number;
  playingMs: number;
  pauseEvents: number;
  recentNotes: { note: string; key: number }[];
  currentNote: string | null;
}

const EMPTY_SESSION = (): SessionStats => ({
  startedAt: 0, notes: 0, playingMs: 0, pauseEvents: 0,
  recentNotes: [], currentNote: null,
});

interface SessionResult {
  stars: number; notes: number; playingMs: number; durationMs: number;
  prevLevel: number; newLevel: number; newStage: typeof PET_STAGES[number];
}

export default function PianoAgentPage() {
  const [targetMin, setTargetMin] = useState(30);
  const [remainingMs, setRemainingMs] = useState(30 * 60 * 1000);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [lifetime, setLifetime] = useState<Lifetime>(() => loadLifetime());
  const [session, setSession] = useState<SessionStats>(EMPTY_SESSION);
  const [result, setResult] = useState<SessionResult | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recentPeaksRef = useRef<number[]>([]);
  const lastPianoAtRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  const lastNoteRef = useRef<{ bin: number; ts: number }>({ bin: -100, ts: 0 });
  const inGraceRef = useRef<boolean>(false);
  const noteKeyRef = useRef<number>(0); // counter for unique React keys on note badges
  const targetMsRef = useRef<number>(30 * 60 * 1000);

  // Reset countdown whenever target changes (and we're not mid-session).
  useEffect(() => {
    if (!running) {
      setRemainingMs(targetMin * 60 * 1000);
      targetMsRef.current = targetMin * 60 * 1000;
    }
  }, [targetMin, running]);

  const finishSession = useCallback((completed: boolean) => {
    const stream = streamRef.current;
    const ctx = ctxRef.current;
    streamRef.current = null;
    ctxRef.current = null;
    analyserRef.current = null;
    stream?.getTracks().forEach((t) => t.stop());
    ctx?.close().catch(() => {});

    // Compute final session result if anything substantive happened.
    setSession((s) => {
      const durationMs = s.startedAt > 0 ? performance.now() - s.startedAt : 0;
      // Only show result if the kid played at least 30 seconds or 5 notes.
      if (durationMs > 30_000 || s.notes >= 5 || completed) {
        const stars = calcStars(s.playingMs, durationMs, s.pauseEvents);
        const playedMinExact = s.playingMs / 60_000;
        const prev = lifetime;
        const next: Lifetime = {
          totalMin: prev.totalMin + playedMinExact,
          totalNotes: prev.totalNotes + s.notes,
          sessions: prev.sessions + 1,
          bestStars: Math.max(prev.bestStars, stars),
        };
        saveLifetime(next);
        setLifetime(next);
        const prevStage = petStageFor(prev.totalMin);
        const newStage = petStageFor(next.totalMin);
        setResult({
          stars, notes: s.notes, playingMs: s.playingMs, durationMs,
          prevLevel: prevStage.level, newLevel: newStage.level, newStage: newStage.stage,
        });
      }
      return EMPTY_SESSION();
    });

    recentPeaksRef.current = [];
    lastPianoAtRef.current = 0;
    lastTickRef.current = 0;
    lastNoteRef.current = { bin: -100, ts: 0 };
    inGraceRef.current = false;
    setRunning(false);
    setStatus("idle");
  }, [lifetime]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.2;
      source.connect(analyser);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      recentPeaksRef.current = [];
      lastPianoAtRef.current = 0;
      lastTickRef.current = 0;
      lastNoteRef.current = { bin: -100, ts: 0 };
      inGraceRef.current = false;
      targetMsRef.current = targetMin * 60 * 1000;
      setRemainingMs(targetMin * 60 * 1000);
      setResult(null);
      setSession({ ...EMPTY_SESSION(), startedAt: performance.now() });
      setRunning(true);
      setStatus("paused");
    } catch {
      alert("Microphone access denied. Allow the mic and try again.");
    }
  }, [targetMin]);

  // Analyze + tick loop.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const analyser = analyserRef.current;
      const ctx = ctxRef.current;
      if (!analyser || !ctx) return;

      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      const peakBin = pianoPeakBin(data, ctx.sampleRate);
      const peaks = recentPeaksRef.current;
      peaks.push(peakBin);
      if (peaks.length > STABILITY_WINDOW) peaks.shift();

      // Stability: 2+ consecutive valid ticks share a peak bin (within tolerance).
      let stable = false;
      let stableBin = -1;
      for (let i = 1; i < peaks.length; i++) {
        if (peaks[i] >= 0 && peaks[i - 1] >= 0 &&
            Math.abs(peaks[i] - peaks[i - 1]) <= PEAK_BIN_TOLERANCE) {
          stable = true;
          stableBin = peaks[i];
          // don't break — pick the LATEST stable bin
        }
      }

      const now = performance.now();
      if (stable) lastPianoAtRef.current = now;

      const wasInGrace = inGraceRef.current;
      const inGrace = lastPianoAtRef.current > 0 && now - lastPianoAtRef.current < GRACE_MS;
      inGraceRef.current = inGrace;

      // Pause-event tracking: count transitions from playing → not playing.
      if (wasInGrace && !inGrace) {
        setSession((s) => ({ ...s, pauseEvents: s.pauseEvents + 1, currentNote: null }));
      }

      setStatus(inGrace ? "playing" : "paused");

      if (inGrace) {
        const elapsed = lastTickRef.current ? now - lastTickRef.current : TICK_MS;
        lastTickRef.current = now;
        const decr = elapsed;
        setRemainingMs((prev) => Math.max(0, prev - decr));

        // Track playing time + detect new note onsets.
        if (stable && stableBin > 0) {
          const peakHz = (stableBin * ctx.sampleRate) / FFT_SIZE;
          const noteName = hzToNote(peakHz);
          const last = lastNoteRef.current;
          const isNewNote =
            Math.abs(stableBin - last.bin) > PEAK_BIN_TOLERANCE ||
            now - last.ts > NEW_NOTE_GAP_MS;
          if (isNewNote && noteName) {
            lastNoteRef.current = { bin: stableBin, ts: now };
            const k = ++noteKeyRef.current;
            setSession((s) => ({
              ...s,
              notes: s.notes + 1,
              playingMs: s.playingMs + decr,
              currentNote: noteName,
              recentNotes: [{ note: noteName, key: k }, ...s.recentNotes].slice(0, 6),
            }));
          } else {
            setSession((s) => ({ ...s, playingMs: s.playingMs + decr, currentNote: noteName }));
          }
        } else {
          setSession((s) => ({ ...s, playingMs: s.playingMs + decr }));
        }
      } else {
        lastTickRef.current = 0;
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [running]);

  // Auto-finish when timer hits zero.
  useEffect(() => {
    if (remainingMs <= 0 && running) {
      setStatus("done");
      finishSession(true);
    }
  }, [remainingMs, running, finishSession]);

  // Cleanup on unmount.
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => {});
  }, []);

  const min = Math.floor(remainingMs / 60000);
  const sec = Math.floor((remainingMs % 60000) / 1000);
  const timeLabel = `${min}:${String(sec).padStart(2, "0")}`;
  const pet = useMemo(() => petStageFor(lifetime.totalMin), [lifetime.totalMin]);
  const progressToNext = pet.next
    ? Math.min(100, ((lifetime.totalMin - pet.stage.min) / (pet.next.min - pet.stage.min)) * 100)
    : 100;

  // Live session stars (preview).
  const liveDuration = session.startedAt > 0 ? performance.now() - session.startedAt : 0;
  const liveStars = calcStars(session.playingMs, liveDuration, session.pauseEvents);

  return (
    <div className="landing piano-page">
      <NavBar />
      <main className="piano-main">
        <h1 className="piano-title">🎹 Pippy's Piano Practice</h1>

        {/* Pet */}
        <div className={`pet-card ${status === "playing" ? "pet-happy" : ""}`}>
          <div className="pet-stage">
            <span className="pet-emoji" aria-label={pet.stage.label}>{pet.stage.emoji}</span>
            {session.recentNotes.length > 0 && (
              <div className="pet-notes" aria-hidden>
                {session.recentNotes.map((n) => (
                  <span key={n.key} className="pet-note">♪ {n.note}</span>
                ))}
              </div>
            )}
          </div>
          <div className="pet-meta">
            <div className="pet-name">{pet.stage.label} · Level {pet.level}</div>
            <div className="pet-msg">"{pet.stage.msg}"</div>
            <div className="pet-progress" title={`${Math.floor(lifetime.totalMin)} min total`}>
              <div className="pet-progress-bar" style={{ width: `${progressToNext}%` }} />
            </div>
            <div className="pet-progress-label">
              {pet.next
                ? `${Math.floor(pet.next.min - lifetime.totalMin)} more min to grow into ${pet.next.emoji}`
                : "Fully grown!"}
            </div>
          </div>
        </div>

        {/* Timer */}
        <button
          type="button"
          className={
            status === "playing" ? "piano-btn piano-btn-playing"
            : status === "paused" && running ? "piano-btn piano-btn-paused"
            : status === "done" ? "piano-btn piano-btn-done"
            : "piano-btn"
          }
          onClick={running ? () => finishSession(false) : start}
          aria-label={running ? "Stop practice" : "Start practice"}
        >
          {timeLabel}
        </button>

        {/* Current note + live stars */}
        <div className="piano-live">
          <div className="piano-live-note">
            {session.currentNote ? `♪ ${session.currentNote}` : running ? "🤫 Listening…" : "Tap the timer to start"}
          </div>
          {running && (
            <div className="piano-live-stars" aria-label={`${liveStars} stars`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={n <= liveStars ? "star-on" : "star-off"}>★</span>
              ))}
            </div>
          )}
        </div>

        {/* Presets */}
        {!running && (
          <div className="piano-presets">
            <span className="piano-presets-label">Goal:</span>
            {PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setTargetMin(m)}
                className={`piano-preset ${targetMin === m ? "active" : ""}`}
              >
                {m}m
              </button>
            ))}
          </div>
        )}

        {/* Session live stats */}
        {running && (
          <div className="piano-stats">
            <span>🎵 {session.notes} notes</span>
            <span>⏱ {Math.floor(session.playingMs / 60000)}m {Math.floor((session.playingMs % 60000) / 1000)}s played</span>
            <span>⏸ {session.pauseEvents} breaks</span>
          </div>
        )}

        {/* Lifetime stats */}
        <div className="piano-lifetime">
          <strong>All time:</strong>
          <span>{Math.floor(lifetime.totalMin)} min</span>
          <span>·</span>
          <span>{lifetime.totalNotes} notes</span>
          <span>·</span>
          <span>{lifetime.sessions} sessions</span>
          {lifetime.bestStars > 0 && (
            <>
              <span>·</span>
              <span>Best {lifetime.bestStars}★</span>
            </>
          )}
        </div>
      </main>

      {/* Session result modal */}
      {result && (
        <SessionResultModal result={result} onClose={() => setResult(null)} />
      )}
    </div>
  );
}

/* ── Result modal ──────────────────────────────────────────── */

function SessionResultModal({
  result,
  onClose,
}: {
  result: SessionResult;
  onClose: () => void;
}) {
  const playedM = Math.floor(result.playingMs / 60000);
  const playedS = Math.floor((result.playingMs % 60000) / 1000);
  const grew = result.newLevel > result.prevLevel;
  return (
    <div className="signin-modal-backdrop" onClick={onClose}>
      <div className="signin-modal piano-result" onClick={(e) => e.stopPropagation()}>
        <button className="signin-modal-close" onClick={onClose} aria-label="Close">×</button>
        <h2 className="piano-result-title">
          {result.stars >= 4 ? "Amazing!" : result.stars >= 3 ? "Great job!" : result.stars >= 2 ? "Good try!" : "Keep going!"}
        </h2>
        <div className="piano-result-stars" aria-label={`${result.stars} stars`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={n <= result.stars ? "star-on" : "star-off"}>★</span>
          ))}
        </div>
        <div className="piano-result-stats">
          <div>🎵 <strong>{result.notes}</strong> notes</div>
          <div>⏱ <strong>{playedM}m {playedS}s</strong> playing</div>
        </div>
        {grew ? (
          <div className="piano-result-grew">
            <span className="piano-result-grew-emoji">{result.newStage.emoji}</span>
            <div>Your pet grew to <strong>Level {result.newLevel}</strong>!</div>
          </div>
        ) : (
          <div className="piano-result-grew">
            <span className="piano-result-grew-emoji">{result.newStage.emoji}</span>
            <div>{result.newStage.msg}</div>
          </div>
        )}
        <button className="btn-primary piano-result-cta" onClick={onClose}>
          Play again
        </button>
      </div>
    </div>
  );
}
