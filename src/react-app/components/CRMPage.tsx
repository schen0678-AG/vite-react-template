import { useState } from "react";
import type { Lead } from "../types";
import LeadInput from "./crm/LeadInput";
import LeadList from "./crm/LeadList";
import ContactInput from "./crm/ContactInput";
import ContactList from "./crm/ContactList";
import PipelineList from "./crm/PipelineList";
import ConvertLeadModal from "./crm/ConvertLeadModal";
import Dashboard from "./Dashboard";

export type CrmTab = "leads" | "contacts" | "pipeline" | "dashboard";

const TABS: { key: CrmTab; label: string }[] = [
  { key: "leads",     label: "Leads" },
  { key: "contacts",  label: "Contacts" },
  { key: "pipeline",  label: "Pipeline" },
  { key: "dashboard", label: "Dashboard" },
];

interface Props {
  initialTab?: CrmTab;
}

export default function CRMPage({ initialTab = "leads" }: Props) {
  const [tab, setTab] = useState<CrmTab>(initialTab);
  const [leadsKey, setLeadsKey] = useState(0);
  const [contactsKey, setContactsKey] = useState(0);
  const [pipelineKey, setPipelineKey] = useState(0);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);

  const handleConverted = () => {
    setConvertingLead(null);
    setLeadsKey((k) => k + 1);
    setPipelineKey((k) => k + 1);
    setTab("pipeline");
  };

  return (
    <div className="assistant">
      <header className="app-header">
        <div className="app-header-inner">
          <a href="/" className="app-logo">
            <span className="logo-icon">A</span>
            <span className="logo-text">Agenlytics Labs</span>
          </a>
          <span className="app-subtitle">Voice CRM</span>
          <a href="/" className="back-link">&larr; Home</a>
        </div>
      </header>

      <main className="app-main">
        <div className="filter-bar" style={{ marginBottom: 16 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`filter-btn ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "leads" && (
          <>
            <LeadInput onLeadCreated={() => setLeadsKey((k) => k + 1)} />
            <LeadList
              refreshKey={leadsKey}
              onConvert={(lead) => setConvertingLead(lead)}
            />
          </>
        )}

        {tab === "contacts" && (
          <>
            <ContactInput
              onContactCreated={() => setContactsKey((k) => k + 1)}
            />
            <ContactList refreshKey={contactsKey} />
          </>
        )}

        {tab === "pipeline" && <PipelineList refreshKey={pipelineKey} />}

        {tab === "dashboard" && <Dashboard />}
      </main>

      {convertingLead && (
        <ConvertLeadModal
          lead={convertingLead}
          onClose={() => setConvertingLead(null)}
          onConverted={handleConverted}
        />
      )}
    </div>
  );
}
