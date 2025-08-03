// src/hooks/useWindowFocusRefetch.ts
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

export const useWindowFocusRefetch = (inactiveThreshold = 30 * 60 * 1000) => {
  const queryClient = useQueryClient();
  const lastActiveTime = useRef(Date.now());

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        const timeInactive = now - lastActiveTime.current;

        if (timeInactive > inactiveThreshold) {
          console.log(
            "🔄 App was inactive for",
            Math.round(timeInactive / 60000),
            "minutes, refetching data..."
          );
          queryClient.invalidateQueries();
        }
      } else {
        lastActiveTime.current = Date.now();
      }
    };

    const handleFocus = () => {
      const now = Date.now();
      const timeInactive = now - lastActiveTime.current;

      if (timeInactive > inactiveThreshold) {
        console.log(
          "🔄 Window was inactive for",
          Math.round(timeInactive / 60000),
          "minutes, refetching data..."
        );
        queryClient.invalidateQueries();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [queryClient, inactiveThreshold]);
};
