import { useEffect, useRef, useState } from "react";
import { startSession } from "../api/sessionApi";
import { useSession } from "../context/SessionContext";
import { useMentorSocket } from "../hooks/useMentorSocket";
import { useFrameStreamer } from "../hooks/useFrameStreamer";
import { useNavigate } from "react-router-dom";


import SocraticOrb from "../components/SocraticOrb/SocraticOrb";
import MentorMessage from "../components/MentorMessage/MentorMessage";
import CodeOverlay from "../components/CodeOverlay/CodeOverlay";
import FocusMeter from "../components/FocusMeter/FocusMeter";
import SettingsPanel from "../components/SettingsPanel/SettingsPanel";

import { getReport } from "../api/reportApi";
import { socket } from "../socket/mentorSocket";


const MentorIDE = () => {
  const ideRef = useRef(null); // Ref for the container
  const videoRef = useRef(null); // Ref for the actual video stream
  const [screenStarted, setScreenStarted] = useState(false);
  const navigate = useNavigate();


  // Hook to handle frame logic
  const sendFrame = useFrameStreamer(ideRef);

  const {
    user, // Assuming you have user object in context now
    setSessionId,
    setMentorMessage,
    setVibe,
    sessionId // Need to check if session is ready
  } = useSession();

  // Initialize Socket.io listeners
  useMentorSocket();

  // 🔹 1. Start backend session on mount
  useEffect(() => {
    const init = async () => {
      try {
        const res = await startSession({
          user_id: user?.id || 1, // Fallback to 1 for dev, but try to use context
          session_id: crypto.randomUUID()
        });

        setSessionId(res.session_id);
        setMentorMessage(res.message);
        setVibe("listening");
      } catch (err) {
        console.error("Session Init Failed:", err);
      }
    };

    init();
  }, [user]);

const endSession = async () => {
  console.log("End session initiated...");


  window.speechSynthesis.cancel();

  if (!sessionId) {
    console.error("No Session ID found in state.");
    alert("Session not found. Returning to dashboard.");
    navigate("/mentor");
    return;
  }

  try {
   
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      console.log("🎥 Screen stream stopped.");
    }

    // 3. Get the report
    const res = await getReport(sessionId);
    console.log("Report API raw response:", res);

    // 4. Cleanup Socket
    if (socket.connected) {
      socket.disconnect();
      console.log("Socket disconnected.");
    }

   
    navigate("/report", {
      state: {
        report: res?.data?.report || res?.report || "No report content generated.",
        message: res?.data?.message || res?.message || "Session Ended Successfully"
      }
    });

  } catch (err) {
    console.error("❌ End session failed:", err);
   
    if (window.confirm("Failed to generate report. Exit anyway?")) {
      navigate("/mentor");
    }
  }
};




  // 🔹 2. Start Screen Share
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 1 }, // Low frame rate saves CPU on your IdeaPad
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScreenStarted(true);
      }
    } catch (err) {
      console.error("Screen share failed:", err);
    }
  };

  // 🔹 3. Auto-Streaming Logic (Throttled for Gemini 3 Limits)
  useEffect(() => {
    if (!screenStarted || !sessionId) return;

    // Initial capture once screen starts
    sendFrame();

    const interval = setInterval(() => {
      console.log("🚀 Interval triggering frame capture...");
      sendFrame();
    }, 30000); // 30s is safe for Gemini 3 Flash Preview limits

    return () => clearInterval(interval);
  }, [screenStarted, sessionId, sendFrame]);

  return (
    <div style={{ position: "relative", height: "100vh", background: "#000", overflow: "hidden" }}>
      
      {/* 🔹 Floating Action Controls */}
      <div style={{ position: "absolute", top: "20px", left: "20px", zIndex: 2000, display: "flex", gap: "10px" }}>
        {!screenStarted ? (
          <button onClick={startScreenShare} className="btn-primary">
            ▶ Start Screen Share
          </button>
        ) : (
          <button onClick={() => sendFrame()} className="btn-secondary">
            📸 Manual Analysis
          </button>
        )}
      </div>

      {/* 🔹 The "Eye" (IDE Capture Area) */}
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
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: screenStarted ? "block" : "none"
          }}
        />
        
        {!screenStarted && (
          <div style={{ color: "#4fd1c5", fontFamily: "monospace", textAlign: "center" }}>
            <p>EYE STATUS: OFFLINE</p>
            <p style={{ fontSize: "0.8rem", color: "#666" }}>Waiting for screen stream...</p>
          </div>
        )}
      </div>

      {/* 🔹 HUD & AI Overlays */}
      <CodeOverlay />
      <SettingsPanel />
      <FocusMeter />
      <SocraticOrb />
      <MentorMessage />

      {/* 🔹 End Session Button */}
      
<button
  onClick={(e) => {
    e.stopPropagation(); // Prevents click from bubbling to the video
    endSession();
  }}
  style={{
    position: "fixed", // Changed from absolute to fixed
    top: "20px",
    right: "20px",
    zIndex: 10000,   // Highest priority
    padding: "12px 20px",
    background: "#f56565",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    pointerEvents: "auto" // Ensures the button is clickable
  }}
>
  ⏹ End Session
</button>

    </div>
  );
};

export default MentorIDE;