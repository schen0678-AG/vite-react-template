import type { Team, Agent } from "./agentData";
import { getTeamAgents, teamColors } from "./agentData";
import AgentCard from "./AgentCard";

interface Props {
  team: Team;
  onSelectAgent: (agent: Agent) => void;
}

export default function TeamSection({ team, onSelectAgent }: Props) {
  const teamAgents = getTeamAgents(team.id);
  const Icon = team.icon;
  const colors = teamColors[team.color] || teamColors.blue;

  return (
    <div className="flex items-center gap-3">
      {/* Team pill label */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${colors.bg} shrink-0`}
      >
        <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
        <span className={`text-xs font-semibold ${colors.text} whitespace-nowrap`}>
          {team.label}
        </span>
      </div>

      {/* Short connector */}
      <div className="w-4 h-px bg-gray-300 shrink-0" />

      {/* Agents in a row */}
      <div className="flex items-end gap-1">
        {teamAgents.map((agent, i) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            index={i}
            onClick={() => onSelectAgent(agent)}
          />
        ))}
      </div>
    </div>
  );
}
