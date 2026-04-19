import { useState, useRef, useCallback } from "react";

interface VoiceInputProps {
  onEntryCreated: () => void;
}

export default function VoiceInput({ onEntryCreated }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<{
    category: string;
    title: string;
    feedback: string;
  } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const detectLanguage = (text: string): string => {
    const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf]/;
    return cjkRegex.test(text) ? "zh-CN" : "en-US";
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release the microphone
        stream.getTracks().forEach((t) => t.stop());

        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (audioBlob.size === 0) return;

        // Send to Whisper for transcription
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "audio.webm");

          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const err = await res.json();
            alert(`Transcription error: ${err.error || "Unknown"}`);
            return;
          }

          const data = (await res.json()) as { text: string; language: string };
          setTranscript((prev) => (prev ? prev + " " + data.text : data.text));
        } catch {
          alert("Failed to transcribe audio");
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      alert("Microphone access denied. Please allow microphone access.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const handleSubmit = async () => {
    if (!transcript.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setLastFeedback(null);

    const text = transcript.trim();
    const language = detectLanguage(text);

    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.error || "Unknown error"}`);
        return;
      }

      const entry = await res.json();
      setLastFeedback({
        category: entry.category,
        title: entry.title,
        feedback: entry.feedback,
      });
      setTranscript("");
      onEntryCreated();
    } catch {
      alert("Failed to connect to server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isSubmitting || isTranscribing;

  return (
    <div className="voice-input">
      <div className="voice-input-header">
        <h2>What's on your mind?</h2>
      </div>

      <div className="voice-input-area">
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Tap the mic or type here... (English or Chinese)"
          rows={4}
          disabled={isBusy}
        />

        <div className="voice-input-actions">
          <button
            className={`mic-btn ${isRecording ? "listening" : ""}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isBusy}
            title={isRecording ? "Stop recording" : "Start recording"}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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

          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={!transcript.trim() || isBusy}
          >
            {isSubmitting
              ? "Thinking..."
              : isTranscribing
                ? "Transcribing..."
                : "Send"}
          </button>
        </div>
      </div>

      {isRecording && (
        <div className="listening-indicator">
          <span className="pulse" />
          Recording... tap stop when done
        </div>
      )}

      {isTranscribing && (
        <div className="listening-indicator">
          <span className="pulse" style={{ background: "#6366f1" }} />
          Transcribing with Whisper...
        </div>
      )}

      {lastFeedback && (
        <div className="feedback-card">
          <div className="feedback-header">
            <span className={`category-badge ${lastFeedback.category}`}>
              {lastFeedback.category.replace("_", " ")}
            </span>
            <span className="feedback-title">{lastFeedback.title}</span>
          </div>
          <p className="feedback-text">{lastFeedback.feedback}</p>
        </div>
      )}
    </div>
  );
}
