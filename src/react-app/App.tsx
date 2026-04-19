import { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import AssistantPage from "./components/AssistantPage";
import AgentsPage from "./components/AgentsPage";
import "./App.css";

function App() {
  const [page, setPage] = useState(window.location.pathname);

  useEffect(() => {
    const handleNav = () => setPage(window.location.pathname);
    window.addEventListener("popstate", handleNav);
    return () => window.removeEventListener("popstate", handleNav);
  }, []);

  if (page === "/assistant") {
    return <AssistantPage />;
  }

  if (page === "/agents") {
    return <AgentsPage />;
  }

  return <LandingPage />;
}

export default App;
