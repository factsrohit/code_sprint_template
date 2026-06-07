import React, { useState, useEffect, useRef, useCallback } from "react";
import ForestEnvironment from "./components/ForestEnvironment";
import Navbar from "./components/Navbar";
import LoginRegister from "./components/LoginRegister";
import Leaderboard from "./components/Leaderboard";
import ParticipantDashboard from "./components/ParticipantDashboard";
import AdminDashboard from "./components/AdminDashboard";
import CinematicIntro from "./components/CinematicIntro";
import CursorAndEffects from "./components/CursorAndEffects";
import SoundEngine from "./components/SoundEngine";
import UpsideDownToggle from "./components/UpsideDownToggle";

/* ── Scroll-reveal hook ────────────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".location-reveal");
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("revealed"); io.unobserve(e.target); }
      });
    }, { threshold: 0.08 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  });
}

/* ── Stranger Things warning transmissions ─────────────────────────────── */
const UPSIDE_DOWN_WARNINGS = [
  "⚠ THE DEMOGORGON HAS BEEN SPOTTED — STAY INSIDE",
  "THE LIGHTS ARE FLICKERING AGAIN. IT'S CLOSE.",
  "THE GATE IS WIDENING. CONTAINMENT FAILING.",
  "ELEVEN SENSED SOMETHING IN THE VOID. RUN.",
  "THE MIND FLAYER KNOWS WHERE YOU ARE.",
  "WILL IS MISSING AGAIN. CHECK THE UPSIDE DOWN.",
  "HAWKINS LAB BREACH — ALL SUBJECTS EVACUATE",
  "DO NOT TRUST THE SHADOWS. THEY MOVE.",
  "THE CHRISTMAS LIGHTS ARE SPELLING SOMETHING...",
  "R · U · N",
  "VECNA'S CLOCK IS TICKING. FOUR CHIMES LEFT.",
  "FRIENDS DON'T LIE. BUT MONSTERS DO.",
];

function WarningTicker() {
  const [msg, setMsg]     = useState("");
  const [visible, setVis] = useState(false);
  useEffect(() => {
    const show = () => {
      setMsg(UPSIDE_DOWN_WARNINGS[Math.floor(Math.random() * UPSIDE_DOWN_WARNINGS.length)]);
      setVis(true);
      setTimeout(() => setVis(false), 5000);
      setTimeout(show, 32000 + Math.random() * 55000);
    };
    const t = setTimeout(show, 14000 + Math.random() * 20000);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <div style={{
      position: "fixed",
      bottom: "5%",
      right: "clamp(0.75rem, 3vw, 2rem)",
      fontFamily: "var(--font-mono)",
      fontSize: "clamp(0.52rem, 1vw, 0.66rem)",
      letterSpacing: "0.15em",
      color: "rgba(239,83,80,0.65)",
      textShadow: "0 0 14px rgba(183,28,28,0.4)",
      animation: "warning-flicker 5s ease-in-out both",
      pointerEvents: "none",
      zIndex: 9990,
      maxWidth: "42vw",
      textAlign: "right",
      lineHeight: 1.6,
    }}>
      {msg}
    </div>
  );
}

/* ── Recovered Hawkins Lab notes (easter egg) ──────────────────────────── */
function FieldLog() {
  const notes = [
    "Log 3: Subject Eleven escaped the lab.",
    "Log 7: The Gate doesn't close. It breathes.",
    "Log 12: Something watches from the Upside Down.",
    "Log 19: Do not look directly into the Void.",
    "Log 24: The Mind Flayer feeds on fear.",
    "Log 31: Vecna was once human. Now he is the gateway.",
  ];
  const [note] = useState(() => notes[Math.floor(Math.random() * notes.length)]);
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 9000); return () => clearTimeout(t); }, []);
  if (!show) return null;
  return (
    <div style={{
      position: "fixed",
      top: "clamp(85px, 13vh, 125px)",
      left: "clamp(0.5rem, 1.5vw, 1rem)",
      fontFamily: "var(--font-mono)",
      fontSize: "clamp(0.5rem, 0.82vw, 0.6rem)",
      color: "rgba(239,83,80,0.3)",
      textShadow: "0 0 8px rgba(183,28,28,0.18)",
      letterSpacing: "0.07em",
      lineHeight: 1.8,
      maxWidth: "175px",
      pointerEvents: "none",
      zIndex: 9989,
      borderLeft: "1px solid rgba(183,28,28,0.2)",
      paddingLeft: "0.6rem",
      animation: "fade-in 2.5s ease both",
      display: "block",
    }}>
      <div style={{ opacity: 0.55, marginBottom: "0.3rem", letterSpacing: "0.15em" }}>
        HAWKINS LAB — RECOVERED
      </div>
      {note}
    </div>
  );
}

/* ── Location section wrapper ──────────────────────────────────────────── */
function LocationSection({ tag, children, style = {} }) {
  return (
    <section className="location-reveal" style={{ ...style }}>
      {tag && <div className="location-tag">{tag}</div>}
      {children}
    </section>
  );
}

/* ── Atmospheric section divider ───────────────────────────────────────── */
function TrailDivider({ label = "" }) {
  return (
    <div className="trail-divider" style={{ margin: "clamp(1.5rem,3vw,3rem) 0" }}>
      {label && (
        <span style={{
          position: "relative", zIndex: 1,
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          color: "rgba(239,83,80,0.3)",
          letterSpacing: "0.4em",
          background: "transparent",
          padding: "0 1rem",
        }}>
          {label}
        </span>
      )}
    </div>
  );
}

/* ── Christmas Lights Component ────────────────────────────────────────── */
const BULB_COLORS = ["bulb-red","bulb-blue","bulb-yellow","bulb-green","bulb-white"];
function LightsStrip({ count = 30 }) {
  return (
    <div className="lights-strip" style={{ justifyContent:"center" }}>
      {Array.from({length:count},(_,i) => (
        <div key={i} className={`bulb ${BULB_COLORS[i % 5]}`}/>
      ))}
    </div>
  );
}

/* ── Footer ────────────────────────────────────────────────────────────── */
function UpsideDownFooter() {
  return (
    <footer style={{
      position: "relative",
      zIndex: 5,
      padding: "clamp(1.5rem,3vw,2.5rem) clamp(1rem,3vw,2rem) clamp(1rem,2vw,1.5rem)",
      borderTop: "1px solid var(--border-glow)",
      background: "linear-gradient(to top, rgba(8,8,8,0.95), transparent)",
      marginTop: "clamp(2rem,4vw,4rem)",
    }}>
      <LightsStrip count={35} />
      <div style={{
        textAlign: "center",
        fontFamily: "var(--font-title)",
        fontSize: "clamp(0.65rem,1.2vw,0.85rem)",
        letterSpacing: "0.15em",
        color: "rgba(239,83,80,0.25)",
        margin: "1.2rem 0 1rem",
        textShadow: "0 0 8px rgba(183,28,28,0.15)",
      }}>
        ◆ THE UPSIDE DOWN ◆
      </div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        maxWidth: 1300,
        margin: "0 auto",
        flexWrap: "wrap",
        gap: "0.5rem",
      }}>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: "clamp(0.48rem,0.88vw,0.6rem)",
          color: "rgba(122,106,106,0.5)",
          letterSpacing: "0.12em",
        }}>
          HAWKINS, INDIANA · 1983—∞ · DIMENSIONAL BREACH: ACTIVE
        </div>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: "clamp(0.48rem,0.88vw,0.6rem)",
          color: "rgba(239,83,80,0.22)",
          letterSpacing: "0.1em",
          textShadow: "0 0 8px rgba(183,28,28,0.1)",
        }}>
          FRIENDS DON'T LIE · THE MIND FLAYER WATCHES
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE TRANSITION WRAPPER
   Static flash → glitch-in on page change. Uses React key prop for clean swap.
   ═══════════════════════════════════════════════════════════════════════════ */
function PageTransition({ pageKey, children }) {
  const [showFlash, setShowFlash] = useState(false);
  const [animClass, setAnimClass] = useState("");
  const prevKeyRef = useRef(pageKey);
  const timeoutsRef = useRef([]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (pageKey === prevKeyRef.current) return;
    prevKeyRef.current = pageKey;

    // Clear any pending timeouts from a previous transition
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    // Trigger glitch sound
    window.__soundEngine?.playGlitchSound?.();

    // Show static flash overlay + enter animation on new content
    setShowFlash(true);
    setAnimClass("page-enter");

    timeoutsRef.current.push(setTimeout(() => setShowFlash(false), 200));
    timeoutsRef.current.push(setTimeout(() => setAnimClass(""), 600));
  }, [pageKey]);

  return (
    <div style={{ position: "relative" }}>
      {showFlash && <div className="static-flash-overlay" />}
      <div key={pageKey} className={animClass}>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [auth, setAuth] = useState(null);
  const [page, setPage] = useState("home");
  const [introComplete, setIntroComplete] = useState(
    () => !!sessionStorage.getItem("intro_seen")
  );

  useReveal();

  useEffect(() => {
    const saved = localStorage.getItem("cops_auth");
    if (saved) {
      try { setAuth(JSON.parse(saved)); }
      catch { localStorage.removeItem("cops_auth"); }
    }
  }, []);

  const login = (data) => {
    setAuth(data);
    localStorage.setItem("cops_auth", JSON.stringify(data));
    setPage(data.isAdmin ? "admin" : "dashboard");
  };
  const logout = () => {
    setAuth(null);
    localStorage.removeItem("cops_auth");
    setPage("home");
  };

  // Determine current page key for transitions
  const getPageKey = () => {
    if (page === "home") return auth ? "home-auth" : "home";
    return page;
  };

  return (
    <>
      {/* ── Cinematic Intro ───────────────────────────────────────────── */}
      {!introComplete && (
        <CinematicIntro onComplete={() => setIntroComplete(true)} />
      )}

      {/* ── Main App (visible after intro) ─────────────────────────────── */}
      {introComplete && (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
          <ForestEnvironment />
          <CursorAndEffects />
          <SoundEngine />
          <UpsideDownToggle />
          <Navbar auth={auth} page={page} setPage={setPage} logout={logout} />

          <main style={{
            flex: 1,
            padding: "clamp(1rem,2.5vw,2rem) clamp(0.75rem,3vw,1.5rem)",
            maxWidth: 1340,
            margin: "0 auto",
            width: "100%",
            position: "relative",
            zIndex: 5,
          }}>
            <PageTransition pageKey={getPageKey()}>

              {/* ── HOME — The Gate Entrance ───────────────────────────── */}
              {page === "home" && (
                <div key="home" className="animate-in">
                  {!auth ? (
                    <div>
                      <LocationSection tag="CHAPTER ONE · ENTER THE UPSIDE DOWN">
                        <div style={{
                          textAlign: "center",
                          padding: "clamp(1rem,3vw,2rem) 0 clamp(1.5rem,4vw,3rem)",
                        }}>
                          <div style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "clamp(0.55rem,1vw,0.7rem)",
                            color: "var(--text-muted)",
                            letterSpacing: "0.28em",
                            marginBottom: "1rem",
                            textShadow: "0 0 12px rgba(183,28,28,0.2)",
                          }}>
                            ▽ HAWKINS NATIONAL LABORATORY · ACCESS TERMINAL ▽
                          </div>
                          <h1 style={{
                            fontFamily: "var(--font-title)",
                            fontSize: "clamp(1.6rem,5vw,3.5rem)",
                            letterSpacing: "0.1em",
                            lineHeight: 1.1,
                            marginBottom: "0.8rem",
                          }}>
                            <span className="glitch-text" data-text="THE UPSIDE DOWN">
                              THE UPSIDE DOWN
                            </span>
                          </h1>
                          <div style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "clamp(0.7rem,1.6vw,1rem)",
                            color: "var(--text-muted)",
                            letterSpacing: "0.35em",
                          }}>
                            CODE SPRINT · JUNE 2026 · COPS
                          </div>
                        </div>
                      </LocationSection>

                      <TrailDivider />

                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "clamp(280px,38%,430px) 1fr",
                        gap: "clamp(1rem,2.5vw,2rem)",
                        alignItems: "start",
                      }} className="home-grid">
                        <LocationSection tag="HAWKINS LAB · SUBJECT AUTHENTICATION">
                          <LoginRegister onLogin={login} />
                        </LocationSection>
                        <LocationSection tag="THE BOARD · PARTY RANKINGS">
                          <Leaderboard />
                        </LocationSection>
                      </div>
                      <style>{`@media(max-width:720px){.home-grid{grid-template-columns:1fr!important}}`}</style>
                    </div>
                  ) : (
                    <LocationSection tag="THE BOARD · PARTY RANKINGS">
                      <Leaderboard />
                    </LocationSection>
                  )}
                </div>
              )}

              {/* ── LEADERBOARD ─────────────────────────────────────────── */}
              {page === "leaderboard" && (
                <div key="leaderboard" className="animate-in">
                  <LocationSection tag="THE BOARD · ALL PARTY MEMBERS">
                    <Leaderboard fullPage />
                  </LocationSection>
                </div>
              )}

              {/* ── DASHBOARD ───────────────────────────────────────────── */}
              {page === "dashboard" && auth && !auth.isAdmin && (
                <div key="dashboard" className="animate-in">
                  <ParticipantDashboard auth={auth} />
                </div>
              )}

              {/* ── ADMIN ───────────────────────────────────────────────── */}
              {page === "admin" && auth && auth.isAdmin && (
                <div key="admin" className="animate-in">
                  <AdminDashboard auth={auth} />
                </div>
              )}

              {/* Unauthenticated redirect */}
              {page === "dashboard" && !auth && (
                <div key="gate" className="animate-in">
                  <LocationSection tag="THE GATE IS LOCKED · AUTHENTICATION REQUIRED">
                    <LoginRegister onLogin={login} />
                  </LocationSection>
                </div>
              )}

            </PageTransition>
          </main>

          <WarningTicker />
          <FieldLog />
          <UpsideDownFooter />
        </div>
      )}
    </>
  );
}