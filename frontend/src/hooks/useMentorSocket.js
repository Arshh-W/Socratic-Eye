import { useEffect } from "react";
import { socket } from "../socket/mentorSocket";
import { useSession } from "../context/SessionContext";

export const useMentorSocket = (initialData) => {  
  const { setMentorMessage, setVibe, setHighlightLines } = useSession();

  useEffect(() => {
    socket.on("mentor_feedback", (data) => {
      console.log("AI Feedback Received:", data);
      setMentorMessage(data.mentor_message);
      setVibe(data.vibe);
      setHighlightLines(data.target_lines);
    });

    socket.on("connect", () => {
      console.log("Socket Connected");
      socket.emit("your_event", initialData);
    });

    socket.on("disconnect", () => console.log("Socket Disconnected"));
    if (socket.connected) {
      socket.emit("your_event", initialData);
    }

    return () => {
      socket.off("mentor_feedback");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, [setMentorMessage, setVibe, setHighlightLines, initialData]);  
};