import { useEffect } from "react";
import { SessionProvider, useSession } from "./context/SessionContext";
import MentorIDE from "./pages/MentorIDE";
import "./styles/globals.css";

/**
 * AppContent exists so we can use SessionContext
 * BEFORE rendering the main UI
 */
const AppContent = () => {
  const { hypeMan } = useSession();

  // Toggle global Hype-Man UI accent
  useEffect(() => {
    document.body.classList.toggle("hype-man", hypeMan);
  }, [hypeMan]);

  return <MentorIDE />;
};

function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}

export default App;
