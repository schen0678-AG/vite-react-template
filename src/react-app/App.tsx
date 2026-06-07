import { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import AssistantPage from "./components/assistant/AssistantPage";
import AgentsPage from "./components/AgentsPage";
import CRMPage from "./components/CRMPage";
import SecurityPage from "./components/SecurityPage";
import PianoAgentPage from "./components/piano/PianoAgentPage";
import RequireAuth from "./components/RequireAuth";
import "./App.css";

function App() {
  const [page, setPage] = useState(window.location.pathname);

  useEffect(() => {
    const handleNav = () => setPage(window.location.pathname);
    window.addEventListener("popstate", handleNav);
    return () => window.removeEventListener("popstate", handleNav);
  }, []);

  if (page === "/assistant") {
    return (
      <RequireAuth label="Personal Assistant">
        <AssistantPage />
      </RequireAuth>
    );
  }

  if (page === "/agents") {
    return <AgentsPage />;
  }

  if (page === "/security") {
    return <SecurityPage />;
  }

  if (page === "/piano") {
    return <PianoAgentPage />;
  }

  if (page === "/crm") {
    return (
      <RequireAuth label="Voice CRM">
        <CRMPage />
      </RequireAuth>
    );
  }

  if (page === "/dashboard") {
    return (
      <RequireAuth label="Dashboard">
        <CRMPage initialTab="dashboard" />
      </RequireAuth>
    );
  }

  return <LandingPage />;
}

export default App;
