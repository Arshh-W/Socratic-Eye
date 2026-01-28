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
  
  // 🔹 1. Add this back inside the provider!
  const [readAloud, setReadAloud] = useState(true); 

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
        readAloud,     // 🔹 2. Expose this to the app
        setReadAloud,  // 🔹 3. Allow SettingsPanel to toggle it
        thoughtSignatureRef
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);