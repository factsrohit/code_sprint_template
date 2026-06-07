import React, { useState, useEffect } from "react";

/* ── Christmas Light Bulbs ─────────────────────────────────────────────── */
const BULB_COLORS = ["bulb-red","bulb-blue","bulb-yellow","bulb-green","bulb-white"];
function LightsStrip({ count = 20 }) {
  return (
    <div className="lights-strip" style={{ justifyContent:"center" }}>
      {Array.from({length:count},(_,i) => (
        <div key={i} className={`bulb ${BULB_COLORS[i % 5]}`}/>
      ))}
    </div>
  );
}

/* ── COPS Hexagon Logo ─────────────────────────────────────────────────── */
function CopsLogo({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <filter id="neon-glow">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Hexagon outline */}
      <polygon
        points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5"
        fill="none" stroke="#ef5350" strokeWidth="3"
        filter="url(#neon-glow)"
        style={{animation:"flicker 6s ease-in-out infinite"}}
      />
      {/* S-shield inside */}
      <text x="50" y="62" textAnchor="middle"
        fontFamily="'Rubik Dirt', cursive" fontSize="36" fontWeight="400"
        fill="#ef5350" filter="url(#neon-glow)"
        style={{animation:"flicker 6s ease-in-out infinite 0.3s"}}
      >S</text>
    </svg>
  );
}

/* ── Nav button ────────────────────────────────────────────────────────── */
function NavBtn({ children, active, onClick, mobile = false }) {
  const [hov, setHov] = useState(false);
  const lit = active || hov;
  return (
    <button
      className="interactive"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: mobile ? (active ? "rgba(183,28,28,0.14)" : "rgba(14,14,14,0.72)") : "transparent",
        border: mobile
          ? `1px solid ${active ? "rgba(183,28,28,0.45)" : "rgba(42,26,26,0.5)"}`
          : "none",
        borderBottom: !mobile ? (active ? "2px solid #ef5350" : "2px solid transparent") : "none",
        borderRadius: mobile ? "4px" : 0,
        fontFamily: "var(--font-title)",
        fontSize: mobile ? "var(--fs-md)" : "var(--fs-xs)",
        letterSpacing: "0.12em",
        color: active ? "#ef5350" : hov ? "#ef5350" : "var(--text-muted)",
        textShadow: lit ? "0 0 4px #ef5350, 0 0 12px #b71c1c, 0 0 30px rgba(127,0,0,0.53)" : "none",
        cursor: "pointer",
        padding: mobile ? "0.9rem 1.3rem" : "0.45rem 0.65rem",
        width: mobile ? "100%" : "auto",
        textAlign: mobile ? "left" : "center",
        transition: "all 0.3s cubic-bezier(0.25,0.8,0.25,1)",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

/* ── Navbar ────────────────────────────────────────────────────────────── */
export default function Navbar({ auth, page, setPage, logout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setMenuOpen(false); }, [page]);

  const go = (p) => { setPage(p); setMenuOpen(false); };
  const doLogout = () => { logout(); setMenuOpen(false); };

  const trails = [
    { key: "leaderboard", label: "THE BOARD",      icon: "📋" },
    ...(auth && !auth.isAdmin ? [{ key: "dashboard", label: "MY CAMPAIGN",    icon: "🎲" }] : []),
    ...(auth &&  auth.isAdmin ? [{ key: "admin",     label: "HAWKINS LAB",    icon: "🔬" }] : []),
    ...(!auth                 ? [{ key: "home",      label: "ENTER THE GATE", icon: "🌀" }] : []),
  ];

  return (
    <nav style={{
      background: "#0a0a0a",
      borderBottom: "1px solid #7f0000",
      boxShadow: "0 2px 20px rgba(183,28,28,0.13)",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      {/* Christmas lights at top */}
      <LightsStrip count={28} />

      <div style={{
        maxWidth: 1340,
        margin: "0 auto",
        padding: "0.72rem clamp(0.75rem,3vw,1.5rem)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}>

        {/* Logo / title */}
        <div className="flex gap-sm pointer" style={{ alignItems:"center", flexShrink:0 }} onClick={() => go("home")}>
          <CopsLogo size={38} />
          <div>
            <div style={{
              fontFamily: "var(--font-title)",
              fontSize: "clamp(0.8rem,1.8vw,1.1rem)",
              letterSpacing: "0.1em",
              color: "#ef5350",
              textShadow: "0 0 4px #ef5350, 0 0 12px #b71c1c, 0 0 30px rgba(127,0,0,0.53)",
              lineHeight: 1.1,
            }}>CODE SPRINT</div>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "clamp(0.46rem,0.88vw,0.6rem)",
              color: "var(--text-muted)",
              letterSpacing: "0.15em",
            }}>
              JUNE 2026 · COPS
            </div>
          </div>
        </div>

        {/* Desktop nav */}
        <div className="flex gap-md" style={{ alignItems:"center" }} id="nav-desktop">
          {trails.map(t => (
            <NavBtn key={t.key} active={page === t.key} onClick={() => go(t.key)}>
              {t.label}
            </NavBtn>
          ))}
          {auth && (
            <div className="flex gap-sm" style={{ alignItems:"center", marginLeft:"0.5rem" }}>
              <span style={{
                fontFamily:"var(--font-mono)",
                fontSize:"var(--fs-xs)",
                color:"var(--text-muted)",
                letterSpacing:"0.06em",
              }}>
                {auth.isAdmin ? "🔬" : "🎲"} {auth.username}
              </span>
              <button
                className="btn btn-ghost"
                style={{ fontSize:"var(--fs-xs)", padding:"0.3rem 0.75rem" }}
                onClick={doLogout}
              >LOGOUT</button>
            </div>
          )}
        </div>

        {/* Hamburger */}
        <button
          id="nav-hamburger"
          aria-label="Open navigation"
          onClick={() => setMenuOpen(m => !m)}
          style={{
            display: "none",
            background: menuOpen ? "rgba(183,28,28,0.14)" : "rgba(14,14,14,0.72)",
            border: "1px solid rgba(127,0,0,0.5)",
            borderRadius: "4px",
            color: menuOpen ? "#ef5350" : "var(--text-muted)",
            fontSize: "1.3rem",
            cursor: "pointer",
            padding: "0.38rem 0.7rem",
            lineHeight: 1,
            transition: "all 0.3s",
            textShadow: menuOpen ? "0 0 14px rgba(183,28,28,0.55)" : "none",
          }}
        >
          {menuOpen ? "✕" : "≡"}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: "absolute",
          top: "100%", left: 0, right: 0,
          background: "rgba(10,10,10,0.97)",
          backdropFilter: "blur(28px)",
          borderBottom: "1px solid #7f0000",
          padding: "1rem clamp(0.75rem,3vw,1.5rem)",
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
          boxShadow: "0 14px 65px rgba(0,0,0,0.92)",
          animation: "slide-in-up 0.28s cubic-bezier(0.34,1.2,0.64,1) both",
          zIndex: 99,
        }}>
          {trails.map(t => (
            <NavBtn key={t.key} active={page === t.key} onClick={() => go(t.key)} mobile>
              {t.icon} {t.label}
            </NavBtn>
          ))}
          {auth && (
            <>
              <div style={{
                fontFamily:"var(--font-mono)", fontSize:"0.72rem",
                color:"var(--text-muted)",
                padding:"0.6rem 1.3rem 0.2rem",
                borderTop:"1px solid var(--border)",
                marginTop:"0.4rem",
              }}>
                {auth.isAdmin ? "🔬" : "🎲"} {auth.username}
              </div>
              <button
                className="btn btn-danger"
                style={{ fontSize:"0.85rem", padding:"0.7rem 1.3rem", width:"100%", textAlign:"left" }}
                onClick={doLogout}
              >
                ⚡ CLOSE THE GATE
              </button>
            </>
          )}
        </div>
      )}

      {/* Christmas lights at bottom */}
      <LightsStrip count={28} />

      <style>{`
        @media (max-width: 640px) {
          #nav-desktop   { display: none !important; }
          #nav-hamburger { display: block !important; }
        }
      `}</style>
    </nav>
  );
}