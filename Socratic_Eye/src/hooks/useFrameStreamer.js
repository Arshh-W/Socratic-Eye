import { socket } from "../socket/mentorSocket";
import { useSession } from "../context/SessionContext";

export const sendFrame = (imageBase64, timestamp) => {
  const {
    sessionId,
    thoughtSignatureRef,
    thinkingLevel
  } = useSession();

  if (!sessionId) return;

  socket.emit("stream_frame", {
    session_id: sessionId,
    image_data: imageBase64,
    timestamp,
    thinking_level: thinkingLevel,
    thought_signature: thoughtSignatureRef.current
  });
};
