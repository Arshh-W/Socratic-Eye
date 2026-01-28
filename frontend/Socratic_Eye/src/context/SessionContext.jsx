import { createContext, useContext, useState, useRef } from "react";

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [mentorMessage, setMentorMessage] = useState("");
  const [vibe, setVibe] = useState("idle");
  const [highlightLines, setHighlightLines] = useState([]);
  const [focusLevel, setFocusLevel] = useState(100);
  const [isDistracted, setIsDistracted] = useState(false);
  const [thinkingLevel, setThinkingLevel] = useState("high");
  const [hypeMan, setHypeMan] = useState(false);
  const [readAloud, setReadAloud] = useState(false);


  const thoughtSignatureRef = useRef(null);

  return (
    <SessionContext.Provider
      value={{
        user,
        setUser,
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
        readAloud,
        setReadAloud,
        thoughtSignatureRef
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
