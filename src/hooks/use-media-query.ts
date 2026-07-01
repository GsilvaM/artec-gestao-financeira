import { useCallback, useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const getMatches = useCallback(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  }, [query]);

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    const mq = window.matchMedia(query);
    function onChange() {
      setMatches(mq.matches);
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
