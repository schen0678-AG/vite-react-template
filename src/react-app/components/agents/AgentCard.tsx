import { useState } from "react";
import type { Agent } from "./agentData";
import { getAvatarUrl } from "./agentData";

interface Props {
  agent: Agent;
  index: number;
  onClick: () => void;
}

export default function AgentCard({ agent, index, onClick }: Props) {
  const [hovered, setHovered] = useState(false);
  const isPlanned = agent.status === "planned";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col items-center cursor-pointer group relative"
      style={{
        opacity: 0,
        animation: `slideUp 0.4s ease-out ${index * 80}ms forwards`,
      }}
    >
      {/* Speech bubble */}
      <div
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-2.5
                    bg-white text-gray-800 rounded-2xl shadow-lg
                    text-xs min-w-[200px] max-w-[280px] text-center z-20 pointer-events-none
                    transition-all duration-200 border border-gray-200
                    ${hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
        style={{ animation: hovered ? "speechBubble 0.25s ease-out" : undefined }}
      >
        <span className="italic">"{agent.hoverQuote}"</span>
        {/* Speech tail */}
        <div className="absolute top-full left-1/2 -translate-x-1/2">
          <div
            className="w-0 h-0
                       border-l-[8px] border-r-[8px] border-t-[8px]
                       border-l-transparent border-r-transparent border-t-white
                       relative z-10"
          />
          <div
            className="w-0 h-0 absolute -top-[1px] left-1/2 -translate-x-1/2
                       border-l-[9px] border-r-[9px] border-t-[9px]
                       border-l-transparent border-r-transparent border-t-gray-200
                       -z-10"
          />
        </div>
      </div>

      {/* Character image */}
      <div
        className={`transition-transform duration-200 group-hover:scale-105
                    ${isPlanned ? "opacity-50 grayscale" : ""}`}
      >
        <img
          src={getAvatarUrl(agent.id)}
          alt={agent.name}
          className="h-32 object-contain"
        />
      </div>

      {/* Active pulse dot */}
      {agent.status === "active" && (
        <span
          className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full
                     border-2 border-white animate-pulse-ring z-10"
        />
      )}

      {/* Name + Title */}
      <h3 className="text-xs font-semibold text-gray-900 mt-1">{agent.name}</h3>
      <p className="text-[10px] text-gray-500 text-center leading-tight max-w-[160px]">
        {agent.title}
      </p>
    </button>
  );
}
