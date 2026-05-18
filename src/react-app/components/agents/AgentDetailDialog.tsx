import * as Dialog from "@radix-ui/react-dialog";
import { X, CheckCircle2, Sparkles, Clock, Circle } from "lucide-react";
import type { Agent, AgentStatus } from "./agentData";
import { teams, teamColors, getAvatarUrl } from "./agentData";

const statusStyles: Record<
  AgentStatus,
  { className: string; icon: typeof Sparkles; label: string; desc: string }
> = {
  active: {
    className: "bg-green-100 text-green-700",
    icon: Sparkles,
    label: "Active",
    desc: "This agent is fully operational and running in production.",
  },
  "in-development": {
    className: "bg-amber-100 text-amber-700",
    icon: Clock,
    label: "In Development",
    desc: "This agent is currently being built and tested.",
  },
  planned: {
    className: "bg-gray-100 text-gray-500",
    icon: Circle,
    label: "Planned",
    desc: "This agent is on the roadmap for future development.",
  },
};

interface Props {
  agent: Agent | null;
  onClose: () => void;
}

export default function AgentDetailDialog({ agent, onClose }: Props) {
  if (!agent) return null;

  const status = statusStyles[agent.status];
  const StatusIcon = status.icon;
  const team = teams.find((t) => t.id === agent.teamId);
  const color = teamColors[team?.color || "blue"] || teamColors.blue;

  return (
    <Dialog.Root open={!!agent} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 z-50 animate-fade-in" />
        <Dialog.Content
          className="fixed top-0 right-0 z-50 h-full w-[380px] max-w-[90vw]
                     bg-white shadow-2xl border-l border-gray-200
                     overflow-y-auto p-6"
          style={{ animation: "slideInRight 0.25s ease-out" }}
        >
          {/* Close */}
          <Dialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </Dialog.Close>

          {/* Avatar */}
          <div className="flex justify-center mb-4 pt-2">
            <img
              src={getAvatarUrl(agent.id)}
              alt={agent.name}
              className="h-52 object-contain"
            />
          </div>

          {/* Name + Title */}
          <Dialog.Title className="text-xl font-bold text-center text-gray-900">
            {agent.name}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-center text-gray-500 mt-1">
            {agent.title}
          </Dialog.Description>

          {/* Status + Team badges */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}
            >
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
            {team && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${color.bg} ${color.text}`}
              >
                {team.label}
              </span>
            )}
          </div>

          {/* First-person introduction */}
          <div className="mt-5 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-700 leading-relaxed italic">
              &ldquo;{agent.fullIntro}&rdquo;
            </p>
          </div>

          {/* Capabilities */}
          <div className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              My Capabilities
            </h3>
            <ul className="space-y-2">
              {agent.capabilities.map((cap, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Status description */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">{status.desc}</p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
