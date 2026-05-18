import { useState } from "react";
import { ceoAgent, teams } from "./agents/agentData";
import type { Agent } from "./agents/agentData";
import AgentCard from "./agents/AgentCard";
import TeamSection from "./agents/TeamSection";
import AgentDetailDialog from "./agents/AgentDetailDialog";

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  return (
    <div className="agents-page">
      {/* Nav (matches the template's existing nav styling) */}
      <nav className="nav">
        <div className="nav-container">
          <a href="/" className="nav-logo">
            <span className="logo-icon">A</span>
            <span className="logo-text">Agenlytics Labs</span>
          </a>
          <div className="nav-links">
            <a href="/">Home</a>
            <a href="/#platform">Platform</a>
            <a href="/assistant" className="nav-cta">Try Assistant</a>
          </div>
        </div>
      </nav>

      <div className="p-6 pb-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Meet the Team</h1>
          <p className="text-sm text-gray-500 mt-1">
            Hover over anyone to see what they do — click for full details
          </p>
        </div>

        {/* ── Horizontal org chart ── */}
        <div className="flex items-stretch gap-0 overflow-x-auto">
          {/* CEO on the far left */}
          <div className="flex items-center shrink-0 pr-4">
            <AgentCard
              agent={ceoAgent}
              index={0}
              onClick={() => setSelectedAgent(ceoAgent)}
            />
          </div>

          {/* Connector: horizontal line into vertical trunk */}
          <div className="flex items-center shrink-0">
            <div className="w-6 h-px bg-gray-300" />
          </div>

          {/* Vertical trunk + team rows */}
          <div className="relative flex flex-col justify-center gap-5 pl-6">
            {/* Vertical trunk line */}
            <div
              className="absolute left-0 w-px bg-gray-300"
              style={{ top: "12%", bottom: "12%" }}
            />

            {teams.map((team) => (
              <div key={team.id} className="flex items-center relative">
                {/* Branch from trunk to team */}
                <div className="absolute left-[-24px] w-6 h-px bg-gray-300" />
                <TeamSection team={team} onSelectAgent={setSelectedAgent} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Detail Dialog ── */}
      <AgentDetailDialog
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </div>
  );
}
