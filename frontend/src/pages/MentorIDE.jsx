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

// Browser-compatible UUID generator
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const MentorIDE = () => {
  const navigate = useNavigate();
  const ideRef = useRef(null); 
  const videoRef = useRef(null); 
  const [screenStarted, setScreenStarted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // adding error state

  // Custom hooks for logic separation
  const sendFrame = useFrameStreamer(ideRef);
  const { processingStatus } = useMentorSocket();

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
    console.log("Audio Context Unlocked");
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
          session_id: generateUUID() // Using compatible UUID generator
        });
        setSessionId(res.session_id);
        setMentorMessage(res.message);
        setVibe("listening");
        setErrorMessage(""); // Clear any previous errors
      } catch (err) {
        console.error("Session Init Failed:", err);
        setErrorMessage("Failed to initialize session. Please check your connection.");
      }
    };
    if (user) init();
  }, [user, setSessionId, setMentorMessage, setVibe]);

  /**
   * Frame Streaming Logic
   * Sends the current screen state to the backend every 30 seconds.
   */
  useEffect(() => {
    // Only start if we have a session and the screen is actually shared
    if (!screenStarted || !sessionId) return;

    console.log("Stream Started for:", sessionId);

    // Delay the FIRST frame to let the UI stabilize
    const initialTimeout = setTimeout(() => {
      sendFrame(); 
    }, 2000);

    // Regular 30s interval
    const interval = setInterval(() => {
      sendFrame();
    }, 30000);

    return () => {
      console.log("Cleaning up stream timers");
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [screenStarted, sessionId]);

  /**
   * Screen Share Initiation
   * Added browser compatibility checks
   */
  const startScreenShare = async () => {
    try {
      // Check if screen capture API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        setErrorMessage("Screen sharing is not supported in your browser. Please use Chrome, Edge, or Firefox on HTTPS.");
        alert("Screen sharing requires:\n1. A modern browser (Chrome, Edge, Firefox)\n2. HTTPS connection\n\nPlease access the app via https://");
        return;
      }

      unlockAudio(); 
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 1 }, 
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScreenStarted(true);
        setErrorMessage(""); // Clear error on success
      }
    } catch (err) {
      console.error("Screen share failed:", err);
      if (err.name === 'NotAllowedError') {
        setErrorMessage("Screen sharing permission denied. Please allow screen access.");
      } else if (err.name === 'NotSupportedError') {
        setErrorMessage("Screen sharing is not supported. Please use HTTPS.");
      } else {
        setErrorMessage(`Screen sharing failed: ${err.message}`);
      }
    }
  };

  /**
   * End Session & Generate Report
   */
  const endSession = async () => {
    window.speechSynthesis.cancel();
    setMentorMessage("");

    if (!sessionId) {
      navigate("/mentor");
      return;
    }

    // Add loading state
    setMentorMessage("Generating your learning report...");

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
      console.error("End session failed:", err);
      
      const errorMessage = err.message || "Unknown error occurred";
      setMentorMessage(`Report generation failed: ${errorMessage}`);
      
      if (window.confirm(`Failed to generate report: ${errorMessage}\n\nExit anyway?`)) {
        if (socket.connected) socket.disconnect();
        setSessionId(null);
        navigate("/mentor");
      } else {
        // User chose to stay, restore UI
        setMentorMessage("");
      }
    }
  };

  // Debug socket connection health
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        console.log('Socket Debug:', {
          connected: socket.connected,
          id: socket.id,
          sessionId: sessionId
        });
      }, 10000); // Every 10 seconds
      return () => clearInterval(interval);
    }
  }, [sessionId]);

  return (
    <div style={{ position: "relative", height: "100vh", background: "#000", overflow: "hidden" }}>
      
      {/* Control UI */}
      <div style={{ 
        position: "absolute", 
        top: "20px", 
        left: "20px", 
        zIndex: 3000, 
        display: "flex", 
        flexDirection: "column", 
        gap: "15px",
        maxWidth: "300px"
      }}>
        {!screenStarted ? (
          <button onClick={startScreenShare} className="btn-primary" style={{ padding: "12px 24px", cursor: "pointer" }}>
            Start Screen Share
          </button>
        ) : (
          <button onClick={() => sendFrame()} className="btn-secondary" style={{ cursor: "pointer" }}>
            Manual Analysis
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
          End Session
        </button>

        {/* processing status */}
        {processingStatus && (
          <div style={{
            background: "#1a202c",
            color: "#4fd1c5",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "0.85rem",
            border: "1px solid #2d3748"
          }}>
            {processingStatus}
          </div>
        )}

        {/* Show error messages */}
        {errorMessage && (
          <div style={{
            background: "#742a2a",
            color: "#feb2b2",
            padding: "10px 12px",
            borderRadius: "6px",
            fontSize: "0.85rem",
            border: "1px solid #9b2c2c",
            lineHeight: "1.4"
          }}>
            {errorMessage}
          </div>
        )}

        {/* Connection status indicator */}
        <div style={{
          background: socket.connected ? "#1a3a1a" : "#3a1a1a",
          color: socket.connected ? "#9ae6b4" : "#fc8181",
          padding: "6px 10px",
          borderRadius: "6px",
          fontSize: "0.75rem",
          border: `1px solid ${socket.connected ? "#2f855a" : "#c53030"}`,
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}>
          <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: socket.connected ? "#48bb78" : "#f56565"
          }} />
          {socket.connected ? "Connected" : "Disconnected"}
        </div>
      </div>

      {/* Visual Core (What the AI Sees) */}
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
            <p style={{ fontSize: "0.7rem", color: "#444", marginTop: "10px" }}>
              Requires HTTPS for screen sharing
            </p>
          </div>
        )}
      </div>

      {/* Floating AI UI Layers */}
      <CodeOverlay />
      <SettingsPanel />
      <FocusMeter />
      <SocraticOrb />
      <MentorMessage />
    </div>
  );
};

export default MentorIDE;