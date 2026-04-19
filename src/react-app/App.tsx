import { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import AssistantPage from "./components/AssistantPage";
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

  return <LandingPage />;
}

export default App;
