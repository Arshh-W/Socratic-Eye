import { useEffect } from "react";
import { useSession } from "../../context/SessionContext";

const MentorMessage = () => {
  const { mentorMessage, readAloud, hypeMan, vibe } = useSession();

  useEffect(() => {
    if (!readAloud || !mentorMessage) {
      window.speechSynthesis.cancel();
      return;
    }

    window.speechSynthesis.cancel();

    const speakNow = () => {
      const utterance = new SpeechSynthesisUtterance(mentorMessage);
      
      // Natural human ranges
      utterance.rate = hypeMan ? 1.1 : 1.0;   
      utterance.pitch = hypeMan ? 1.05 : 1.0; 
      utterance.volume = 1;

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.includes("en-US") && v.name.includes("Google")) 
                     || voices.find(v => v.lang.includes("en"));

      if (preferred) utterance.voice = preferred;
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speakNow;
    } else {
      speakNow();
    }

    return () => window.speechSynthesis.cancel();
  }, [mentorMessage, readAloud, hypeMan]);

  // If there is no message, return null so it doesn't block the screen
  if (!mentorMessage) return null;

  return (
    <div className={`mentor-message ${vibe === 'alert' ? 'alert' : 'calm'}`}>
      {mentorMessage}
    </div>
  );
};

export default MentorMessage;