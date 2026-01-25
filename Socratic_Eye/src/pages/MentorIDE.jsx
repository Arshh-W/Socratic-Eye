import { useEffect, useRef } from "react";
import { startSession } from "../api/sessionApi";
import { useSession } from "../context/SessionContext";
import { useMentorSocket } from "../hooks/useMentorSocket";
import { useFrameStreamer } from "../hooks/useFrameStreamer";

import SocraticOrb from "../components/SocraticOrb/SocraticOrb";
import MentorMessage from "../components/MentorMessage/MentorMessage";
import CodeOverlay from "../components/CodeOverlay/CodeOverlay";
import FocusMeter from "../components/FocusMeter/FocusMeter";
import SettingsPanel from "../components/SettingsPanel/SettingsPanel";

const MentorIDE = () => {
  const ideRef = useRef(null);
  const sendFrame = useFrameStreamer(ideRef);

  const {
    setSessionId,
    setMentorMessage,
    setVibe
  } = useSession();

  useMentorSocket();

  useEffect(() => {
    const init = async () => {
      const res = await startSession({
        user_id: 1,
        session_id: crypto.randomUUID()
      });

      setSessionId(res.session_id);
      setMentorMessage(res.message);
      setVibe("listening");
    };

    init();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      sendFrame();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      {/* IDE AREA */}
      <div
        ref={ideRef}
        style={{
          height: "100%",
          padding: "20px",
          background: "#111",
          color: "white",
          fontFamily: "monospace"
        }}
      >
{`while (i < n) {
  console.log(arr[i])
}`}
      </div>

      <CodeOverlay />
      <SettingsPanel />
      <FocusMeter />
      <SocraticOrb />
      <MentorMessage />
    </div>
  );
};

export default MentorIDE;
