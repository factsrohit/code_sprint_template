import React, { useState, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   UPSIDE DOWN MODE TOGGLE
   Flips the entire world 180° — colors invert, fog intensifies, everything distorts.
   "Will, is that you? Can you hear me?"
   ═══════════════════════════════════════════════════════════════════════════ */

export default function UpsideDownToggle() {
  const [active, setActive] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const toggle = useCallback(() => {
    if (transitioning) return;
    setTransitioning(true);

    // Play glitch sound if available
    if (window.__soundEngine?.playGlitchSound) {
      window.__soundEngine.playGlitchSound();
    }

    // Flicker effect before flip
    const body = document.body;
    let flickerCount = 0;
    const flickerInterval = setInterval(() => {
      body.style.opacity = flickerCount % 2 === 0 ? "0.3" : "1";
      flickerCount++;
      if (flickerCount >= 6) {
        clearInterval(flickerInterval);
        body.style.opacity = "1";

        // Toggle the mode
        const newActive = !active;
        setActive(newActive);

        if (newActive) {
          body.classList.add("upside-down-mode");
        } else {
          body.classList.remove("upside-down-mode");
        }

        setTimeout(() => setTransitioning(false), 700);
      }
    }, 80);
  }, [active, transitioning]);

  return (
    <button
      className={`ud-toggle ${active ? "active" : ""}`}
      onClick={toggle}
      title={active ? "Return to Hawkins" : "Enter the Upside Down"}
      aria-label={active ? "Return to Hawkins" : "Enter the Upside Down"}
      disabled={transitioning}
    >
      {active ? "🔄" : "🙃"}
    </button>
  );
}
