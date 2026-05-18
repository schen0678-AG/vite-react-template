import { useState } from "react";
import LeadInput from "./crm/LeadInput";
import LeadList from "./crm/LeadList";

export default function CRMPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="assistant">
      <header className="app-header">
        <div className="app-header-inner">
          <a href="/" className="app-logo">
            <span className="logo-icon">A</span>
            <span className="logo-text">Agenlytics Labs</span>
          </a>
          <span className="app-subtitle">Voice CRM</span>
          <a href="/" className="back-link">&larr; Back to home</a>
        </div>
      </header>

      <main className="app-main">
        <LeadInput onLeadCreated={() => setRefreshKey((k) => k + 1)} />
        <LeadList refreshKey={refreshKey} />
      </main>
    </div>
  );
}
