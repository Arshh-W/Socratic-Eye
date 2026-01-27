import "./FocusMeter.css";
import { useSession } from "../../context/SessionContext";

const FocusMeter = () => {
  const { focusLevel = 65 } = useSession(); // temp default

  return (
    <div className="focus-meter">
      <svg viewBox="0 0 36 36">
        <path
          className="bg"
          d="M18 2
             a 16 16 0 0 1 0 32
             a 16 16 0 0 1 0 -32"
        />
        <path
          className="progress"
          strokeDasharray={`${focusLevel}, 100`}
          d="M18 2
             a 16 16 0 0 1 0 32
             a 16 16 0 0 1 0 -32"
        />
      </svg>
      <span>{focusLevel}%</span>
    </div>
  );
};

export default FocusMeter;
