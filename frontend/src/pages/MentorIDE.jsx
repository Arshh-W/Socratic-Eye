import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { startSession } from "../api/sessionApi";
import { getReport } from "../api/reportApi";
import { useSession } from "../context/SessionContext";
import { useMentorSocket } from "../hooks/useMentorSocket";
import { useFrameStreamer } from "../hooks/useFrameStreamer";
import { socket } from "../socket/mentorSocket";
import SocraticOrb from "../components/SocraticOrb/SocraticOrb";
import MentorMessage from "../components/MentorMessage/MentorMessage";
import CodeOverlay from "../components/CodeOverlay/CodeOverlay";
import FocusMeter from "../components/FocusMeter/FocusMeter";
import SettingsPanel from "../components/SettingsPanel/SettingsPanel";

const MentorIDE = () => {
  const navigate = useNavigate();
  const ideRef = useRef(null); 
  const videoRef = useRef(null); 
  const [screenStarted, setScreenStarted] = useState(false);

  // Custom hooks for logic separation
  const sendFrame = useFrameStreamer(ideRef);
  useMentorSocket();

  const {
    user,
    setSessionId,
    setMentorMessage,
    setVibe,
    sessionId
  } = useSession();

  /**
   *  Audio Priming (Firefox/Linux Fix)
   * Triggered on user gesture to bypass autoplay restrictions.
   */
  const unlockAudio = () => {
    const speak = new SpeechSynthesisUtterance("System active");
    speak.volume = 0.1;
    window.speechSynthesis.speak(speak);
    console.log("🔊 Audio Context Unlocked");
  };

  /**
   * Initialize Session
   * Creates a new session entry in PostgreSQL and gets the welcome message.
   */
  useEffect(() => {
    const init = async () => {
      try {
        const res = await startSession({
          user_id: user?.id || 1, // Fallback for testing
          session_id: crypto.randomUUID()
        });
        setSessionId(res.session_id);
        setMentorMessage(res.message);
        setVibe("listening");
      } catch (err) {
        console.error("Session Init Failed:", err);
      }
    };
    if (user) init();
  }, [user, setSessionId, setMentorMessage, setVibe]);

  /**
   * Frame Streaming Logic
   * Sends the current screen state to the backend every 30 seconds.
   */
  // 🔹 Inside MentorIDE.jsx
useEffect(() => {
  // 🔹 Only start if we have a session and the screen is actually shared
  if (!screenStarted || !sessionId) return;

  console.log("Stream Started for:", sessionId);

  // 🔹 Delay the FIRST frame to let the UI stabilize
  const initialTimeout = setTimeout(() => {
    sendFrame(); 
  }, 2000);

  // 🔹 Regular 30s interval
  const interval = setInterval(() => {
    sendFrame();
  }, 30000);

  return () => {
    console.log("Cleaning up stream timers");
    clearTimeout(initialTimeout);
    clearInterval(interval);
  };
}, [screenStarted, sessionId]); // 🔹 DO NOT add sendFrame here if it changes on every render
  /**
   * ▶️ Screen Share Initiation
   */
  const startScreenShare = async () => {
    try {
      unlockAudio(); 
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 1 }, 
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

  /**
   * ⏹End Session & Generate Report
   */
  const endSession = async () => {
    window.speechSynthesis.cancel();
    setMentorMessage("");

    if (!sessionId) {
      navigate("/mentor");
      return;
    }

    try {
      // Stop media tracks
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }

      // Fetch the final AI summary from backend
      const res = await getReport(sessionId);

      // Cleanup socket and context
      if (socket.connected) socket.disconnect();
      setSessionId(null); 

      // Navigate to report with data in state
      navigate("/report", {
        state: {
          report: res?.report || "No report content generated.",
          message: res?.message || "Session Ended Successfully"
        }
      });
    } catch (err) {
      console.error("❌ End session failed:", err);
      if (window.confirm("Failed to generate report. Exit anyway?")) {
        navigate("/mentor");
      }
    }
  };

  return (
    <div style={{ position: "relative", height: "100vh", background: "#000", overflow: "hidden" }}>
      
      {/* 🛠️ Control UI */}
      <div style={{ 
        position: "absolute", 
        top: "20px", 
        left: "20px", 
        zIndex: 3000, 
        display: "flex", 
        flexDirection: "column", 
        gap: "15px" 
      }}>
        {!screenStarted ? (
          <button onClick={startScreenShare} className="btn-primary" style={{ padding: "12px 24px", cursor: "pointer" }}>
            ▶ Start Screen Share
          </button>
        ) : (
          <button onClick={() => sendFrame()} className="btn-secondary" style={{ cursor: "pointer" }}>
            📸 Manual Analysis
          </button>
        )}

        <button onClick={endSession} style={{ 
          background: "#f56565", 
          color: "white", 
          border: "none", 
          borderRadius: "8px", 
          padding: "10px 16px", 
          fontWeight: "bold", 
          cursor: "pointer" 
        }}>
          ⏹ End Session
        </button>
      </div>

      {/* 📺 Visual Core (What the AI Sees) */}
      <div ref={ideRef} style={{ 
        height: "100%", 
        width: "100%", 
        background: "#111", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center" 
      }}>
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

      {/* 🪄 Floating AI UI Layers */}
      <CodeOverlay />
      <SettingsPanel />
      <FocusMeter />
      <SocraticOrb />
      <MentorMessage />
    </div>
  );
};

export default MentorIDE;