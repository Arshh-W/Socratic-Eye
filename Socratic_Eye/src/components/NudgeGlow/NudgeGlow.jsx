import "./NudgeGlow.css";
import { useSession } from "../../context/SessionContext";

const NudgeGlow = () => {
  const { isDistracted } = useSession();

  if (!isDistracted) return null;

  return <div className="nudge-glow" />;
};

export default NudgeGlow;
