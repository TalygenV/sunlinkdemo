import { useEffect, useRef } from "react";

export const useIdleTimer = (onIdle: () => void, timeout = 10 * 1000) => {
  const timer = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(onIdle, timeout);
  };

  useEffect(() => {
    const events = [
      "mousemove",
      "mousedown",
      "keypress",
      "scroll",
      "touchstart",
    ];

    for (const event of events) {
      window.addEventListener(event, resetTimer);
    }

    resetTimer();

    return () => {
      for (const event of events) {
        window.removeEventListener(event, resetTimer);
      }
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
};
