import { useState, useRef } from "react";
import type { Contact, ParsedContact } from "../../types";

interface ContactInputProps {
  onContactCreated: (c: Contact) => void;
}

const blankParsed: ParsedContact = {
  name: "",
  company: "",
  title: "",
  email: "",
  phone: "",
  wechat: "",
  address: "",
  notes: "",
};

const detectLanguage = (t: string): string =>
  /[一-鿿㐀-䶿]/.test(t) ? "zh-CN" : "en-US";

export default function ContactInput({ onContactCreated }: ContactInputProps) {
  const [transcript, setTranscript] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [review, setReview] = useState<ParsedContact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const submitVoice = async () => {
    if (!transcript.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: transcript.trim(),
          language: detectLanguage(transcript),
          source: "voice",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to capture contact");
        return;
      }
      const contact = (await res.json()) as Contact;
      onContactCreated(contact);
      setTranscript("");
    } catch {
      setError("Failed to connect to server");
    } finally {
      setSubmitting(false);
    }
  };

  const scanCard = async (file: File) => {
    setScanning(true);
    setError(null);
    setReview(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/contacts/scan-card", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to scan card");
        return;
      }
      const { parsed } = (await res.json()) as { parsed: ParsedContact };
      setReview({ ...blankParsed, ...parsed });
    } catch {
      setError("Failed to upload card image");
    } finally {
      setScanning(false);
    }
  };

  const saveReview = async () => {
    if (!review?.name?.trim()) {
      setError("Name is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parsed: review,
          source: "card_scan",
          language: detectLanguage(review.name + " " + review.company),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to save");
        return;
      }
      const contact = (await res.json()) as Contact;
      onContactCreated(contact);
      setReview(null);
    } catch {
      setError("Failed to connect to server");
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = submitting || scanning;

  return (
    <div className="voice-input">
      <div className="voice-input-header">
        <h2>Add a contact</h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
          Type details, or scan a business card to extract automatically.
        </p>
      </div>

      <div className="voice-input-area">
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder='e.g. "Daniel Wong, CTO at GreenGrid, daniel@greengrid.com.au, +61 411 222 333"'
          rows={3}
          disabled={isBusy}
        />

        <div className="voice-input-actions">
          <button
            type="button"
            className="mic-btn"
            disabled={isBusy}
            onClick={() => fileRef.current?.click()}
            title="Scan business card"
            style={{ background: "var(--accent-light)", color: "var(--accent)" }}
          >
            {/* Camera icon */}
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) scanCard(f);
              e.target.value = "";
            }}
          />

          <button
            className="submit-btn"
            onClick={submitVoice}
            disabled={!transcript.trim() || isBusy}
          >
            {submitting ? "Saving..." : "Save Contact"}
          </button>
        </div>
      </div>

      {scanning && (
        <div className="listening-indicator">
          <span className="pulse" style={{ background: "#6366f1" }} />
          Reading the card with Claude vision...
        </div>
      )}

      {error && (
        <div
          className="feedback-card"
          style={{ borderColor: "#fecaca", background: "#fef2f2" }}
        >
          <p className="feedback-text" style={{ color: "#b91c1c" }}>
            {error}
          </p>
        </div>
      )}

      {/* Card-scan review form */}
      {review && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            background: "#f8fafc",
          }}
        >
          <h3 style={{ fontSize: 14, marginBottom: 12, color: "var(--text)" }}>
            Review extracted fields
          </h3>
          <div style={{ display: "grid", gap: 8 }}>
            {(
              [
                ["name", "Name *"],
                ["company", "Company"],
                ["title", "Title"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["wechat", "WeChat"],
                ["address", "Address"],
                ["notes", "Notes"],
              ] as [keyof ParsedContact, string][]
            ).map(([k, label]) => (
              <label key={k} style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {label}
                <input
                  type="text"
                  value={review[k] ?? ""}
                  onChange={(e) => setReview({ ...review, [k]: e.target.value })}
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: 4,
                    padding: "6px 8px",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    fontSize: 14,
                    color: "var(--text)",
                  }}
                />
              </label>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              className="submit-btn"
              onClick={saveReview}
              disabled={submitting || !review.name.trim()}
            >
              {submitting ? "Saving..." : "Save Contact"}
            </button>
            <button
              type="button"
              onClick={() => setReview(null)}
              style={{
                padding: "10px 16px",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 14,
                color: "var(--text-secondary)",
              }}
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
