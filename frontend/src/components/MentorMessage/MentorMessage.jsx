import { useEffect } from "react";
import { useSession } from "../../context/SessionContext";

const MentorMessage = () => {
  const { mentorMessage, readAloud, hypeMan } = useSession();

  useEffect(() => {
    if (!readAloud || !mentorMessage) return;

    //  stop any previous voice
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(mentorMessage);

    
    utterance.rate = hypeMan ? 1.05 : 0.95;   // calmer
    utterance.pitch = hypeMan ? 1.1 : 0.85;   // deeper
    utterance.volume = 1;

   
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.lang === "en-US" && v.name.toLowerCase().includes("google")
    );

    if (preferred) utterance.voice = preferred;

    window.speechSynthesis.speak(utterance);

  }, [mentorMessage, readAloud, hypeMan]);

  return (
    <div className="mentor-message">
      {mentorMessage}
    </div>
  );
};

export default MentorMessage;
