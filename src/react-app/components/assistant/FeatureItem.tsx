import type { AssistantFeature } from "../../types";

interface Props {
  feature: AssistantFeature;
  highlighted?: boolean;
  onDelete: () => void;
}

export default function FeatureItem({ feature, highlighted, onDelete }: Props) {
  return (
    <div className={`asst-feature ${highlighted ? "asst-feature-new" : ""}`}>
      <div className="asst-feature-head">
        <strong>{feature.summary}</strong>
        <button
          className="asst-icon-btn"
          onClick={onDelete}
          title="Delete feature"
          aria-label="Delete feature"
        >
          ×
        </button>
      </div>
      {feature.details.length > 0 && (
        <ul className="asst-feature-details">
          {feature.details.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
