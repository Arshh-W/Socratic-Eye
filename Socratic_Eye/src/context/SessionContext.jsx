import { createContext, useContext, useState, useRef } from "react";

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  // AUTH
  const [user, setUser] = useState(null);

  // SESSION
  const [sessionId, setSessionId] = useState(null);
  const [mentorMessage, setMentorMessage] = useState("");
  const [vibe, setVibe] = useState("idle");
  const [highlightLines, setHighlightLines] = useState([]);
  const [focusLevel, setFocusLevel] = useState(100);
  const [isDistracted, setIsDistracted] = useState(false);
  const [thinkingLevel, setThinkingLevel] = useState("high"); // low | high
  const [hypeMan, setHypeMan] = useState(false);

  const thoughtSignatureRef = useRef(null);

  return (
    <SessionContext.Provider
      value={{
        //  AUTH
        user,
        setUser,

        //  SESSION
        sessionId,
        setSessionId,
        mentorMessage,
        setMentorMessage,
        vibe,
        setVibe,
        highlightLines,
        setHighlightLines,
        focusLevel,
        setFocusLevel,
        isDistracted,
        setIsDistracted,
        thinkingLevel,
        setThinkingLevel,
        hypeMan,
        setHypeMan,

        thoughtSignatureRef
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
