// src/hooks/useIsDark.ts
import { useEffect, useState } from "react";

export function useIsDark() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const match = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);

      setIsDark(match.matches);
      match.addEventListener("change", handler);

      return () => match.removeEventListener("change", handler);
    }
  }, []);

  return isDark;
}
