import React, { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   CINEMATIC INTRO — The Gate Opens
   Full-screen intro sequence: darkness → flicker → glitch text → PRESS START → portal tear
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── VHS Static Canvas ─────────────────────────────────────────────────── */
function VHSStatic({ opacity = 0.12 }) {
  const ref = useRef(null);
  const raf = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => {
      canvas.width = Math.min(window.innerWidth, 640);
      canvas.height = Math.min(window.innerHeight, 400);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const draw = () => {
      const w = canvas.width, h = canvas.height;
      const imageData = ctx.createImageData(w, h);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
        imageRendering: "pixelated",
      }}
    />
  );
}

/* ── Glitch Typing Effect ──────────────────────────────────────────────── */
function GlitchTyper({ text, onComplete, delay = 0 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    let i = 0;
    let timeout;
    const glitchChars = "█▓▒░╔╗╚╝═║╬▄▀";

    const typeNext = () => {
      if (i >= text.length) {
        setDone(true);
        onComplete?.();
        return;
      }

      // Occasional glitch
      if (Math.random() < 0.2 && i > 0) {
        setGlitching(true);
        const glitchLen = Math.min(3, text.length - i);
        let glitchText = text.slice(0, i);
        for (let g = 0; g < glitchLen; g++) {
          glitchText += glitchChars[Math.floor(Math.random() * glitchChars.length)];
        }
        setDisplayed(glitchText);
        timeout = setTimeout(() => {
          setGlitching(false);
          i++;
          setDisplayed(text.slice(0, i));
          timeout = setTimeout(typeNext, 40 + Math.random() * 30);
        }, 60);
      } else {
        i++;
        setDisplayed(text.slice(0, i));
        timeout = setTimeout(typeNext, 50 + Math.random() * 40);
      }
    };

    timeout = setTimeout(typeNext, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return (
    <span
      className={glitching ? "glitch-text" : ""}
      data-text={displayed}
      style={{
        borderRight: done ? "none" : "3px solid var(--bright)",
        paddingRight: done ? 0 : "4px",
        animation: done ? "none" : "type-cursor-blink 0.8s step-end infinite",
      }}
    >
      {displayed}
    </span>
  );
}

/* ── Portal Tear Effect ────────────────────────────────────────────────── */
function PortalTear({ onComplete }) {
  const [phase, setPhase] = useState(0); // 0=flicker, 1=tearing, 2=done

  useEffect(() => {
    // Phase 0: Screen flickers 3 times
    const flickerDuration = 600;
    const t1 = setTimeout(() => setPhase(1), flickerDuration);
    const t2 = setTimeout(() => {
      setPhase(2);
      onComplete?.();
    }, flickerDuration + 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === 2) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100000,
      pointerEvents: "none",
    }}>
      {phase === 0 && (
        <div style={{
          position: "absolute", inset: 0,
          background: "#000",
          animation: "intro-flicker 0.6s ease-in-out forwards",
        }} />
      )}
      {phase >= 1 && (
        <>
          {/* Left half tears away */}
          <div className="portal-tear-left" style={{
            position: "absolute", top: 0, left: 0,
            width: "50%", height: "100%",
            background: "#000",
          }} />
          {/* Right half tears away */}
          <div className="portal-tear-right" style={{
            position: "absolute", top: 0, right: 0,
            width: "50%", height: "100%",
            background: "#000",
          }} />
          {/* Red energy line in the middle */}
          <div style={{
            position: "absolute",
            top: 0, left: "50%",
            transform: "translateX(-50%)",
            width: "4px",
            height: "100vh",
            background: "linear-gradient(to bottom, transparent, var(--bright) 20%, var(--primary) 50%, var(--bright) 80%, transparent)",
            boxShadow: "0 0 30px var(--bright), 0 0 60px var(--primary), 0 0 100px rgba(183,28,28,0.5)",
            animation: "portal-energy 1.2s cubic-bezier(0.25,0.8,0.25,1) forwards",
          }} />
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN CINEMATIC INTRO
   ══════════════════════════════════════════════════════════════════════════ */
export default function CinematicIntro({ onComplete }) {
  const [phase, setPhase] = useState(() => {
    // Skip intro if already seen this session
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("intro_seen")) return "done";
    return "darkness";
  });
  // darkness → flicker → text → subtitle → ready → tearing → done
  const [skipVisible, setSkipVisible] = useState(false);
  const [hoveringStart, setHoveringStart] = useState(false);

  // If already "done" on mount, notify parent immediately
  useEffect(() => {
    if (phase === "done") {
      onComplete?.();
      return;
    }

    // Phase timeline
    const timers = [];
    timers.push(setTimeout(() => setPhase("flicker"), 1500));
    timers.push(setTimeout(() => setPhase("text"), 3000));
    timers.push(setTimeout(() => setSkipVisible(true), 2000));
    return () => timers.forEach(clearTimeout);
  }, []);

  const onTextComplete = useCallback(() => {
    setTimeout(() => setPhase("subtitle"), 400);
  }, []);

  const onSubtitleComplete = useCallback(() => {
    setTimeout(() => setPhase("ready"), 600);
  }, []);

  const handleStart = () => {
    sessionStorage.setItem("intro_seen", "1");
    setPhase("tearing");
  };

  const handleSkip = () => {
    sessionStorage.setItem("intro_seen", "1");
    setPhase("done");
    onComplete?.();
  };

  const handleTearComplete = () => {
    setPhase("done");
    onComplete?.();
  };

  if (phase === "done") return null;
  if (phase === "tearing") return <PortalTear onComplete={handleTearComplete} />;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100000,
      background: "#000",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    }}>
      {/* VHS Static layer */}
      <VHSStatic opacity={phase === "darkness" ? 0.03 : 0.08} />

      {/* Subtle red ambient glow */}
      {phase !== "darkness" && (
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at center, rgba(183,28,28,0.06) 0%, transparent 60%)",
          animation: "intro-flicker 2s ease-in-out forwards",
          pointerEvents: "none",
        }} />
      )}

      {/* Main content */}
      <div style={{
        position: "relative", zIndex: 2,
        textAlign: "center",
        padding: "2rem",
        maxWidth: "90vw",
      }}>
        {/* Phase: flicker — red light flashes */}
        {phase === "flicker" && (
          <div style={{
            position: "absolute",
            inset: "-200px",
            background: "radial-gradient(circle at center, rgba(183,28,28,0.15) 0%, transparent 50%)",
            animation: "intro-flicker 1.5s ease-in-out forwards",
            pointerEvents: "none",
          }} />
        )}

        {/* Phase: text — glitch typing */}
        {(phase === "text" || phase === "subtitle" || phase === "ready") && (
          <div style={{ marginBottom: "2rem" }}>
            <div style={{
              fontFamily: "var(--font-title)",
              fontSize: "clamp(1.2rem, 4.5vw, 3rem)",
              color: "var(--bright)",
              letterSpacing: "0.12em",
              lineHeight: 1.2,
              textShadow: "0 0 4px #ef5350, 0 0 12px #b71c1c, 0 0 30px rgba(127,0,0,0.53), 0 0 60px rgba(183,28,28,0.3)",
            }}>
              <GlitchTyper
                text="WELCOME TO THE UPSIDE DOWN"
                onComplete={onTextComplete}
                delay={0}
              />
            </div>
          </div>
        )}

        {/* Phase: subtitle */}
        {(phase === "subtitle" || phase === "ready") && (
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "clamp(0.6rem, 1.5vw, 0.9rem)",
            letterSpacing: "0.4em",
            marginBottom: "3rem",
            animation: "fade-in 1s ease both",
          }}>
            <GlitchTyper
              text="CODE SPRINT · JUNE 2026 · COPS"
              onComplete={onSubtitleComplete}
              delay={0}
            />
          </div>
        )}

        {/* Phase: ready — PRESS START button */}
        {phase === "ready" && (
          <div style={{ animation: "fade-in 0.8s ease both" }}>
            <button
              onClick={handleStart}
              onMouseEnter={() => setHoveringStart(true)}
              onMouseLeave={() => setHoveringStart(false)}
              style={{
                background: "transparent",
                border: `2px solid ${hoveringStart ? "var(--bright)" : "var(--border-glow)"}`,
                color: "var(--bright)",
                fontFamily: "var(--font-title)",
                fontSize: "clamp(0.9rem, 2.5vw, 1.5rem)",
                letterSpacing: "0.2em",
                padding: "1rem 3rem",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                animation: "press-start-pulse 2s ease-in-out infinite",
                transition: "all 0.3s ease",
                transform: hoveringStart ? "scale(1.05) skewX(-1deg)" : "scale(1)",
                boxShadow: hoveringStart
                  ? "0 0 30px rgba(239,83,80,0.5), 0 0 60px rgba(183,28,28,0.3), inset 0 0 30px rgba(183,28,28,0.1)"
                  : "0 0 15px rgba(183,28,28,0.3)",
                filter: hoveringStart ? "brightness(1.2)" : "none",
              }}
            >
              {/* Glitch distortion on hover */}
              {hoveringStart && (
                <div style={{
                  position: "absolute", inset: 0,
                  background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(239,83,80,0.05) 2px, rgba(239,83,80,0.05) 4px)",
                  pointerEvents: "none",
                  animation: "static-grain 0.3s steps(5) infinite",
                }} />
              )}
              ⚡ PRESS START ⚡
            </button>

            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "clamp(0.45rem, 0.9vw, 0.55rem)",
              color: "rgba(122,106,106,0.4)",
              letterSpacing: "0.2em",
              marginTop: "2rem",
              animation: "fade-in 2s ease both 1s",
            }}>
              THE GATE IS WAITING
            </div>
          </div>
        )}
      </div>

      {/* Skip button */}
      {skipVisible && phase !== "ready" && (
        <button
          onClick={handleSkip}
          style={{
            position: "absolute",
            bottom: "clamp(20px, 4vh, 40px)",
            right: "clamp(20px, 3vw, 40px)",
            background: "transparent",
            border: "1px solid rgba(122,106,106,0.3)",
            color: "rgba(122,106,106,0.5)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            letterSpacing: "0.15em",
            padding: "0.4rem 1rem",
            cursor: "pointer",
            transition: "all 0.3s",
            zIndex: 10,
          }}
          onMouseEnter={e => { e.target.style.color = "var(--bright)"; e.target.style.borderColor = "var(--bright)"; }}
          onMouseLeave={e => { e.target.style.color = "rgba(122,106,106,0.5)"; e.target.style.borderColor = "rgba(122,106,106,0.3)"; }}
        >
          SKIP →
        </button>
      )}

      {/* CRT scanlines on intro */}
      <div style={{
        position: "absolute", inset: 0,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)",
        pointerEvents: "none",
        zIndex: 3,
      }} />
    </div>
  );
}
