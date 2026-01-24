import { useEffect } from "react";
import { startSession } from "../api/sessionApi";
import { useSession } from "../context/SessionContext";
import { useMentorSocket } from "../hooks/useMentorSocket";
import SocraticOrb from "../components/SocraticOrb/SocraticOrb";
import MentorMessage from "../components/MentorMessage/MentorMessage";
import CodeOverlay from "../components/CodeOverlay/CodeOverlay";
import FocusMeter from "../components/FocusMeter/FocusMeter";
import NudgeGlow from "../components/NudgeGlow/NudgeGlow";
import { useFocusMonitor } from "../hooks/useFocusMonitor";
import SettingsPanel from "../components/SettingsPanel/SettingsPanel";


const MentorIDE = () => {
  const { setSessionId, setMentorMessage, setVibe } = useSession();

  useMentorSocket();
  useFocusMonitor();

  useEffect(() => {
    const init = async () => {
      setVibe("listening");

    try {
    const data = await startSession({
        encouragement: true,
        difficulty: "hard"
    });

    setSessionId(data.session_id);
    setMentorMessage(data.message);
    } catch (err) {
    console.warn("Backend not connected yet, using mock session");

    setSessionId("offline-session");
    setMentorMessage("Backend offline. Running in demo mode.");
    }

    };

    init();
  }, []);

    return (
    <div style={{ position: "relative", height: "100vh" }}>
        {/* IDE goes here later */}
        <SettingsPanel />
        <FocusMeter />
        <NudgeGlow />
        <CodeOverlay />
        <SocraticOrb />
        <MentorMessage />
    </div>
    );

};

export default MentorIDE;
