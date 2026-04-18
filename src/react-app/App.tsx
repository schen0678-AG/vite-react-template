import { useState } from "react";
import VoiceInput from "./components/VoiceInput";
import HistoryList from "./components/HistoryList";
import "./App.css";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEntryCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <a href="/" className="app-logo">
            <span className="logo-icon">A</span>
            <span className="logo-text">Agenlytics</span>
          </a>
          <span className="app-subtitle">Personal Assistant</span>
        </div>
      </header>

      <main className="app-main">
        <VoiceInput onEntryCreated={handleEntryCreated} />
        <HistoryList refreshKey={refreshKey} />
      </main>
    </div>
  );
}

export default App;
