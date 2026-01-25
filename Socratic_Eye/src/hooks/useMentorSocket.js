import { useEffect } from "react";
import { socket } from "../socket/mentorSocket";
import { useSession } from "../context/SessionContext";

export const useMentorSocket = () => {
  const {
    sessionId,
    setMentorMessage,
    setVibe,
    setHighlightLines
  } = useSession();

  useEffect(() => {
    if (!sessionId) return;

    socket.connect();

    socket.on("mentor_feedback", (data) => {
      // Map backend → UI
      setVibe(data.vibe || "neutral");
      setMentorMessage(data.mentor_message);
      setHighlightLines(data.target_lines || []);
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err);
    });

    return () => {
      socket.off("mentor_feedback");
    };
  }, [sessionId]);
};
