import type { AssistantProject } from "../../types";
import FeatureItem from "./FeatureItem";

interface Props {
  projects: AssistantProject[];
  highlightedFeatureIds: Set<number>;
  highlightedProjectIds: Set<number>;
  onDeleteProject: (id: number) => void;
  onDeleteFeature: (id: number) => void;
}

export default function ProjectsPanel({
  projects,
  highlightedFeatureIds,
  highlightedProjectIds,
  onDeleteProject,
  onDeleteFeature,
}: Props) {
  return (
    <section className="asst-panel">
      <h2 className="asst-panel-title">
        Projects <span className="asst-count">{projects.length}</span>
      </h2>
      {projects.length === 0 ? (
        <p className="asst-empty">
          No projects yet. Tell me what you're working on — I'll organize it.
        </p>
      ) : (
        <div className="asst-projects">
          {projects.map((p) => (
            <div
              key={p.id}
              className={`asst-project ${highlightedProjectIds.has(p.id) ? "asst-project-new" : ""}`}
            >
              <div className="asst-project-head">
                <div>
                  <h3 className="asst-project-name">{p.name}</h3>
                  {p.description && (
                    <p className="asst-project-desc">{p.description}</p>
                  )}
                </div>
                <button
                  className="asst-icon-btn"
                  onClick={() => {
                    if (confirm(`Delete project "${p.name}" and all its features?`)) {
                      onDeleteProject(p.id);
                    }
                  }}
                  title="Delete project"
                  aria-label="Delete project"
                >
                  ×
                </button>
              </div>
              <div className="asst-features">
                {p.features.length === 0 ? (
                  <p className="asst-empty asst-empty-sub">No features yet.</p>
                ) : (
                  p.features.map((f) => (
                    <FeatureItem
                      key={f.id}
                      feature={f}
                      highlighted={highlightedFeatureIds.has(f.id)}
                      onDelete={() => onDeleteFeature(f.id)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
