import "./MentorMessage.css";
import { useEffect } from "react";
import { useSession } from "../../context/SessionContext";

const MentorMessage = () => {
  const { mentorMessage, hypeMan } = useSession();

  useEffect(() => {
    if (!mentorMessage || !hypeMan) return;

    const utterance = new SpeechSynthesisUtterance(mentorMessage);
    utterance.rate = 0.95;
    utterance.pitch = 1.1;

    window.speechSynthesis.cancel(); // stop previous
    window.speechSynthesis.speak(utterance);
  }, [mentorMessage, hypeMan]);

  return (
    <div className="mentor-message">
      {mentorMessage}
    </div>
  );
};

export default MentorMessage;
