import "./SocraticOrb.css";
import { useSession } from "../../context/SessionContext";

const SocraticOrb = () => {
  const { vibe } = useSession();

  return (
    <div className={`socratic-orb ${vibe}`}>
      <div className="orb-core" />
    </div>
  );
};

export default SocraticOrb;
