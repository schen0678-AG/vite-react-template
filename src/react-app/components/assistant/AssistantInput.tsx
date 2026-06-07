import { useState, useRef, useCallback } from "react";

interface Props {
  onSubmit: (text: string, language: string) => Promise<void>;
  busy: boolean;
}

const CJK = /[一-鿿㐀-䶿]/;

export default function AssistantInput({ onSubmit, busy }: Props) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        // Skip clearly-empty recordings client-side too (saves a roundtrip).
        if (blob.size < 2 * 1024) {
          alert("Didn't catch anything — try recording for a bit longer.");
          return;
        }
        setIsTranscribing(true);
        try {
          const form = new FormData();
          form.append("audio", blob, "audio.webm");
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(`Transcription error: ${(err as { error?: string }).error || "Unknown"}`);
            return;
          }
          const data = (await res.json()) as { text: string };
          const transcribed = data.text.trim();
          if (!transcribed) {
            alert("Couldn't transcribe — the audio was silent or too quiet.");
            return;
          }
          setText((prev) => (prev ? prev + " " + transcribed : transcribed));
        } catch {
          alert("Failed to transcribe audio");
        } finally {
          setIsTranscribing(false);
        }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
    } catch {
      alert("Microphone access denied. Open the address bar's mic icon to re-enable.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    setIsRecording(false);
  }, []);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const language = CJK.test(trimmed) ? "zh-CN" : "en-US";
    await onSubmit(trimmed, language);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const disabled = busy || isTranscribing;

  return (
    <div className="asst-input">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Talk to your assistant — projects, ideas, reminders. (English or 简体中文)"
        rows={3}
        disabled={disabled}
      />
      <div className="asst-input-row">
        <button
          type="button"
          className={`mic-btn ${isRecording ? "listening" : ""}`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
          title={isRecording ? "Stop recording" : "Start recording"}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isRecording ? (
              <rect x="6" y="6" width="12" height="12" rx="2" />
            ) : (
              <>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </>
            )}
          </svg>
        </button>
        <div className="asst-input-hint">
          {isRecording && <span className="asst-input-pulse" /> }
          {isRecording
            ? "Recording…"
            : isTranscribing
              ? "Transcribing…"
              : busy
                ? "Thinking…"
                : "⌘/Ctrl + Enter to send"}
        </div>
        <button
          type="button"
          className="submit-btn"
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
        >
          {busy ? "Thinking…" : "Send"}
        </button>
      </div>
    </div>
  );
}
