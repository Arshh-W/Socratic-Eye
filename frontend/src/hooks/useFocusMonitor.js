import { useEffect } from "react";
import { useSession } from "../context/SessionContext";

export const useFocusMonitor = () => {
  const { setIsDistracted, setFocusLevel } = useSession();

  useEffect(() => {
    let idleTimer;

    const onBlur = () => {
      setIsDistracted(true);
      setFocusLevel((f) => Math.max(f - 5, 0));
    };

    const onFocus = () => {
      setIsDistracted(false);
    };

    const resetIdle = () => {
      setFocusLevel((f) => Math.min(f + 1, 100));
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsDistracted(true);
      }, 12000);
    };

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("keydown", resetIdle);

    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("keydown", resetIdle);
    };
  }, []);
};
