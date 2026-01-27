import { useEffect, useRef, useState } from "react";
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
  const videoRef = useRef(null);
  const [screenStarted, setScreenStarted] = useState(false);

  const sendFrame = useFrameStreamer(ideRef);

  const {
    setSessionId,
    setMentorMessage,
    setVibe
  } = useSession();

  // socket listener
  useMentorSocket();

  // 🔹 Start backend session
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

  // 🔹 Screen capture logic
  const startScreenShare = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 1 },
      audio: false
    });

    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;

    videoRef.current = video;

    ideRef.current.innerHTML = "";
    ideRef.current.appendChild(video);

    setScreenStarted(true);
  };

  // 🔹 Send frames every 2 seconds
  useEffect(() => {
    if (!screenStarted) return;

    const interval = setInterval(() => {
      sendFrame();
    }, 2000);

    return () => clearInterval(interval);
  }, [screenStarted]);

  return (
    <div style={{ position: "relative", height: "100vh", background: "#000" }}>
      
      {/* START SCREEN BUTTON */}
      {!screenStarted && (
        <button
          onClick={startScreenShare}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            zIndex: 2000,
            padding: "10px 16px",
            background: "#4fd1c5",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          ▶ Start Screen
        </button>
      )}

      {/* SCREEN / IDE AREA */}
      <div
        ref={ideRef}
        style={{
          height: "100%",
          width: "100%",
          background: "#111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {!screenStarted && (
          <div style={{ color: "#888", fontFamily: "monospace" }}>
            Waiting for screen share...
          </div>
        )}
      </div>

      {/* UI OVERLAYS */}
      <CodeOverlay />
      <SettingsPanel />
      <FocusMeter />
      <SocraticOrb />
      <MentorMessage />
    </div>
  );
};

export default MentorIDE;
