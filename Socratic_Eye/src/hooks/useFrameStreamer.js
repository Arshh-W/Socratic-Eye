import html2canvas from "html2canvas";
import { socket } from "../socket/mentorSocket";
import { useSession } from "../context/SessionContext";

export const useFrameStreamer = (ref) => {
  const { sessionId, thinkingLevel } = useSession();

  return async () => {
    if (!ref.current || !sessionId) return;

    const canvas = await html2canvas(ref.current, {
      scale: 0.5,
      useCORS: true,
      logging: false
    });

    const image = canvas.toDataURL("image/jpeg", 0.7);

    socket.emit("stream_frame", {
      session_id: sessionId,
      image,
      settings: {
        deepdebug: thinkingLevel === "high"
      }
    });
  };
};