import { useState, useRef, useCallback } from "react";

interface VoiceInputProps {
  onEntryCreated: () => void;
}

type Language = "en-US" | "zh-CN";

export default function VoiceInput({ onEntryCreated }: VoiceInputProps) {
  const [language, setLanguage] = useState<Language>("en-US");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<{
    category: string;
    title: string;
    feedback: string;
  } | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const SpeechRecognitionAPI =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const hasSpeech = !!SpeechRecognitionAPI;

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = transcript;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setTranscript(finalTranscript);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [SpeechRecognitionAPI, language, transcript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const handleSubmit = async () => {
    if (!transcript.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setLastFeedback(null);

    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript.trim(), language }),
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

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en-US" ? "zh-CN" : "en-US"));
  };

  return (
    <div className="voice-input">
      <div className="voice-input-header">
        <h2>{language === "en-US" ? "What's on your mind?" : "\u4F60\u5728\u60F3\u4EC0\u4E48\uFF1F"}</h2>
        <button className="lang-toggle" onClick={toggleLanguage}>
          {language === "en-US" ? "\u4E2D\u6587" : "EN"}
        </button>
      </div>

      <div className="voice-input-area">
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={
            language === "en-US"
              ? "Tap the mic or type here..."
              : "\u70B9\u51FB\u9EA6\u514B\u98CE\u6216\u5728\u8FD9\u91CC\u8F93\u5165..."
          }
          rows={4}
          disabled={isSubmitting}
        />

        <div className="voice-input-actions">
          {hasSpeech && (
            <button
              className={`mic-btn ${isListening ? "listening" : ""}`}
              onClick={isListening ? stopListening : startListening}
              disabled={isSubmitting}
              title={isListening ? "Stop" : "Start listening"}
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
                {isListening ? (
                  <>
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </>
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
          )}

          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={!transcript.trim() || isSubmitting}
          >
            {isSubmitting
              ? language === "en-US"
                ? "Thinking..."
                : "\u601D\u8003\u4E2D..."
              : language === "en-US"
                ? "Send"
                : "\u53D1\u9001"}
          </button>
        </div>
      </div>

      {isListening && (
        <div className="listening-indicator">
          <span className="pulse" />
          {language === "en-US" ? "Listening..." : "\u6B63\u5728\u542C..."}
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
