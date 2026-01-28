import { useEffect } from "react";
import { useSession } from "../../context/SessionContext";
import "./MentorMessage.css"; 

const MentorMessage = () => {
  const { mentorMessage, vibe, readAloud, hypeMan } = useSession();

  useEffect(() => {
    // 🔹 1. Guard Clause: Don't speak if disabled or message is empty
    if (!readAloud || !mentorMessage) return;

    // 🔹 2. Reset the speech queue to avoid overlapping messages
    window.speechSynthesis.cancel();

    const speak = () => {
  const utterance = new SpeechSynthesisUtterance(mentorMessage);
  const voices = window.speechSynthesis.getVoices();

  // 🔹 Strict filtering to avoid the German/System accent
  const betterVoice = voices.find(v => v.name === "Google US English") || 
                      voices.find(v => v.name === "Google US English Male") ||
                      voices.find(v => v.lang === "en-US" && v.name.includes("Male")) ||
                      voices.find(v => v.lang === "en-US");

  if (betterVoice) {
    utterance.voice = betterVoice;
    console.log("🗣️ Using Voice:", betterVoice.name); // 🔍 Verify in console
  }

  utterance.rate = 0.9; 
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
};

    // 🔹 4. Handle Firefox/Linux Voice Loading Async
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speak;
    } else {
      speak();
    }

    // 🔹 5. Cleanup when the component unmounts or message changes
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [mentorMessage, readAloud, hypeMan]);

  return (
    <div className="mentor-message-container">
      {mentorMessage && (
        <div className={`mentor-bubble ${hypeMan ? 'hype-vibe' : 'teacher-vibe'}`}>
          <div className="mentor-label">
            {vibe === "encouraging" ? "💡 SUGGESTION" : "👁️ SOCRATIC EYE"}
          </div>
          <p className="mentor-text">{mentorMessage}</p>
        </div>
      )}
    </div>
  );
};

export default MentorMessage;