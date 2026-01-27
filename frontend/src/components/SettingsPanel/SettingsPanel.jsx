import "./SettingsPanel.css";
import { useSession } from "../../context/SessionContext";

const SettingsPanel = () => {
  const {
    thinkingLevel,
    setThinkingLevel,
    hypeMan,
    setHypeMan
  } = useSession();
  

  return (
    <div className="settings-panel" role="dialog" aria-label="Socratic Eye Settings">
      <h4>Mentor Settings</h4>

      <div className="setting">
        <label>Thinking Level</label>
        <button
          onClick={() =>
            setThinkingLevel(thinkingLevel === "high" ? "low" : "high")
          }
          aria-pressed={thinkingLevel === "high"}
        >
          {thinkingLevel === "high" ? "Deep Reasoning" : "Fast Feedback"}
        </button>
      </div>

      <div className="setting">
        <label>Hype-Man Mode</label>
        <input
          type="checkbox"
          checked={hypeMan}
          onChange={() => setHypeMan(!hypeMan)}
          aria-checked={hypeMan}
        />
      </div>
    </div>
  );
};

export default SettingsPanel;
