import { useEffect, useState } from "react";

// Branded intro. Plays on every full page load. Respects reduced motion (shorter, no drawing).
export default function Splash() {
  const [phase, setPhase] = useState("in");
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const a = setTimeout(() => setPhase("out"), reduce ? 500 : 1700);
    const b = setTimeout(() => setPhase("gone"), reduce ? 800 : 2100);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  if (phase === "gone") return null;
  return (
    <div id="sp" className={phase === "out" ? "out" : ""} role="presentation">
      <svg width="96" height="96" viewBox="0 0 48 48" role="img" aria-label="DPathfinder AI">
        <circle className="ring" pathLength="1" cx="24" cy="24" r="15" fill="none" stroke="var(--ac)" strokeWidth="2.5" />
        <path className="rt" pathLength="1" d="M13.4 34.6C13.4 24 21 27 24 24S35 22 34.6 13.4" fill="none" stroke="var(--cy)" strokeWidth="3" strokeLinecap="round" />
        <circle className="nd" cx="13.4" cy="34.6" r="3.6" fill="var(--ac)" />
        <path className="nd" d="M34.6 6.8l3.4 6.6-3.4 6.6-3.4-6.6z" fill="var(--tx)" transform="rotate(45 34.6 13.4)" />
      </svg>
      <div className="wd">DPathfinder <b>AI</b></div>
    </div>
  );
}
