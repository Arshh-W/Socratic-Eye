import { useEffect, useState } from "react";
import { socket } from "../socket/mentorSocket";
import { useSession } from "../context/SessionContext";

export const useMentorSocket = (initialData) => {  
  const { setMentorMessage, setVibe, setHighlightLines } = useSession();
  const [processingStatus, setProcessingStatus] = useState(null);

  useEffect(() => {
    //  frame_received acknowledgment handler
    socket.on("frame_received", (data) => {
      console.log("Backend acknowledged frame:", data);
      setProcessingStatus("Backend is processing your code...");
    });

    // Adding processing update handler
    socket.on("processing_update", (data) => {
      console.log("Processing update:", data);
      setProcessingStatus(`${data.stage}: ${data.status}`);
    });

    //  Add throttle handler
    socket.on("throttled", (data) => {
      console.log("Request throttled:", data);
      setProcessingStatus(data.msg);
      // Clear status after retry period
      setTimeout(() => setProcessingStatus(null), data.retry_after * 1000);
    });

    socket.on("mentor_feedback", (data) => {
      console.log("AI Feedback Received:", data);
      setMentorMessage(data.mentor_message);
      setVibe(data.vibe);
      setHighlightLines(data.target_lines);
      setProcessingStatus(null); // Clear processing status
    });

    socket.on("error", (data) => {
      console.error("Socket error received:", data);
      setProcessingStatus(`Error: ${data.msg}`);
      setMentorMessage("Oops! Something went wrong. Try again in a moment.");
    });

    socket.on("connect", () => {
      console.log("🔌 Socket Connected");
      setProcessingStatus(null);
      if (initialData) {
        socket.emit("your_event", initialData);
      }
    });

    // disconnect handler
    socket.on("disconnect", (reason) => {
      console.log("Socket Disconnected:", reason);
      setProcessingStatus("Disconnected. Reconnecting...");
      
      // Distinguish between intentional and unexpected disconnects
      if (reason === "io server disconnect") {
        // Server kicked us out, might need to refresh session
        console.warn("Server terminated connection");
      } else if (reason === "transport close" || reason === "transport error") {
        // Network issue, auto-reconnect will handle it
        console.warn("Network issue detected");
      }
    });

    //reconnection handlers
    socket.on("reconnect", (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      setProcessingStatus(null);
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
      setProcessingStatus(`Reconnecting (attempt ${attemptNumber})...`);
    });

    socket.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
    });

    socket.on("reconnect_failed", () => {
      console.error("Reconnection failed");
      setProcessingStatus("Connection lost. Please refresh the page.");
    });

    //connect_error handler
    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setProcessingStatus("Connection error. Retrying...");
    });

    if (socket.connected && initialData) {
      socket.emit("your_event", initialData);
    }
    return () => {
      socket.off("frame_received");
      socket.off("processing_update");
      socket.off("throttled");
      socket.off("mentor_feedback");
      socket.off("error");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("reconnect");
      socket.off("reconnect_attempt");
      socket.off("reconnect_error");
      socket.off("reconnect_failed");
      socket.off("connect_error");
    };
  }, [setMentorMessage, setVibe, setHighlightLines, initialData]);

  return { processingStatus };
};