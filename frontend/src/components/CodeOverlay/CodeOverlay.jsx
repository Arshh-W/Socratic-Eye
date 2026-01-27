import "./CodeOverlay.css";
import { useSession } from "../../context/SessionContext";

const LINE_HEIGHT = 22; // px (adjust later per editor)
const TOP_OFFSET = 80;  // px (header / toolbar offset)

const CodeOverlay = () => {
  const { highlightLines } = useSession();

  return (
    <div className="code-overlay-layer">
      {highlightLines.map((line) => (
        <div
          key={line}
          className="code-highlight"
          style={{
            top: TOP_OFFSET + (line - 1) * LINE_HEIGHT
          }}
        />
      ))}
    </div>
  );
};

export default CodeOverlay;

