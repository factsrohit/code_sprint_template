import React, { useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   CURSOR & EFFECTS — Glowing Orb + Click Ripple + Chromatic Aberration
   ═══════════════════════════════════════════════════════════════════════════ */

export default function CursorAndEffects() {
  const orbRef  = useRef(null);
  const ringRef = useRef(null);
  const pos     = useRef({ x: -100, y: -100 });
  const orbPos  = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const raf     = useRef(null);
  const isMobile = typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

  // Lerp-based cursor follow
  useEffect(() => {
    if (isMobile) return;

    document.body.classList.add("cinematic-cursor");

    const lerp = (a, b, t) => a + (b - a) * t;

    const tick = () => {
      orbPos.current.x = lerp(orbPos.current.x, pos.current.x, 0.18);
      orbPos.current.y = lerp(orbPos.current.y, pos.current.y, 0.18);
      ringPos.current.x = lerp(ringPos.current.x, pos.current.x, 0.08);
      ringPos.current.y = lerp(ringPos.current.y, pos.current.y, 0.08);

      if (orbRef.current) {
        orbRef.current.style.left = `${orbPos.current.x}px`;
        orbRef.current.style.top = `${orbPos.current.y}px`;
      }
      if (ringRef.current) {
        ringRef.current.style.left = `${ringPos.current.x}px`;
        ringRef.current.style.top = `${ringPos.current.y}px`;
      }

      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    const onClick = (e) => {
      // Add clicking class briefly
      orbRef.current?.classList.add("clicking");
      ringRef.current?.classList.add("clicking");
      setTimeout(() => {
        orbRef.current?.classList.remove("clicking");
        ringRef.current?.classList.remove("clicking");
      }, 150);

      // Create ripple
      const ripple = document.createElement("div");
      ripple.className = "click-ripple";
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("click", onClick);

    return () => {
      document.body.classList.remove("cinematic-cursor");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  if (isMobile) {
    // Mobile: only render chromatic aberration + VHS tracking, no cursor
    return (
      <>
        <ChromaticAberration />
        <VHSTrackingLines />
      </>
    );
  }

  return (
    <>
      {/* Cursor orb */}
      <div ref={orbRef} className="cursor-orb" />
      {/* Cursor ring */}
      <div ref={ringRef} className="cursor-ring" />
      {/* Chromatic aberration SVG filter */}
      <ChromaticAberration />
      {/* VHS tracking lines */}
      <VHSTrackingLines />
    </>
  );
}

/* ── Chromatic Aberration Layer ─────────────────────────────────────────── */
function ChromaticAberration() {
  return (
    <>
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="chromatic-aberration">
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="red"
            />
            <feOffset in="red" dx="-1" dy="0" result="red-shifted" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="blue"
            />
            <feOffset in="blue" dx="1" dy="0" result="blue-shifted" />
            <feBlend in="red-shifted" in2="SourceGraphic" mode="screen" result="rb" />
            <feBlend in="blue-shifted" in2="rb" mode="screen" />
          </filter>
        </defs>
      </svg>
      <div
        className="chromatic-aberration-layer"
        style={{
          backdropFilter: "url(#chromatic-aberration)",
          WebkitBackdropFilter: "url(#chromatic-aberration)",
        }}
      />
    </>
  );
}

/* ── VHS Tracking Lines ────────────────────────────────────────────────── */
function VHSTrackingLines() {
  return (
    <>
      <div className="vhs-tracking-line" />
      <div className="vhs-tracking-line" />
    </>
  );
}
