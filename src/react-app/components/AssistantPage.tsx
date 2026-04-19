import { useState } from "react";
import VoiceInput from "./VoiceInput";
import HistoryList from "./HistoryList";

export default function AssistantPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEntryCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="assistant">
      <header className="app-header">
        <div className="app-header-inner">
          <a href="/" className="app-logo">
            <span className="logo-icon">A</span>
            <span className="logo-text">Agenlytics Labs</span>
          </a>
          <span className="app-subtitle">Personal Assistant</span>
          <a href="/" className="back-link">&larr; Back to home</a>
        </div>
      </header>

      <main className="app-main">
        <VoiceInput onEntryCreated={handleEntryCreated} />
        <HistoryList refreshKey={refreshKey} />
      </main>
    </div>
  );
}
