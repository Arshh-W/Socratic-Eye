import "./MentorMessage.css";
import { useSession } from "../../context/SessionContext";

const MentorMessage = () => {
  const { mentorMessage, vibe } = useSession();

  if (!mentorMessage) return null;

  return (
    <div className={`mentor-message ${vibe}`}>
      {mentorMessage}
    </div>
  );
};

export default MentorMessage;
