import { useEffect } from "react";
import { socket } from "../socket/mentorSocket";
import { useSession } from "../context/SessionContext";

export const useMentorSocket = () => {
  const {
    sessionId,
    setMentorMessage,
    setVibe,
    setHighlightLines,
    thoughtSignatureRef
  } = useSession();

  useEffect(() => {
    if (!sessionId) return;

    socket.connect();

    socket.on("mentor_feedback", (data) => {
      setVibe("speaking");
      setMentorMessage(data.message);

      setHighlightLines(data.highlight_lines || []);
      thoughtSignatureRef.current = data.thought_signature;
    });

    return () => {
      socket.off("mentor_feedback");
    };
  }, [sessionId]);
};
