import React, { useState, useEffect } from "react";

function Cursor() {
  return (
    <span style={{
      display: "inline-block",
      width: "9px",
      height: "1.1em",
      background: "var(--bright)",
      marginLeft: "3px",
      verticalAlign: "text-bottom",
      boxShadow: "0 0 8px rgba(239,83,80,0.6)",
      animation: "cursor-blink 1.1s step-end infinite",
    }}/>
  );
}

function TLabel({ children }) {
  return (
    <label style={{
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-xs)",
      letterSpacing: "0.14em",
      color: "var(--bright)",
      textTransform: "uppercase",
      marginBottom: "0.4em",
      display: "block",
      opacity: 0.7,
    }}>
      &gt; {children}
    </label>
  );
}

export default function LoginRegister({ onLogin }) {
  const [mode, setMode]         = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [typed, setTyped]       = useState("");

  const subtitle = mode === "login"
    ? "AUTHENTICATE SUBJECT ACCESS — CLEARANCE LEVEL REQUIRED"
    : "INITIALIZE NEW SUBJECT FILE IN HAWKINS LAB REGISTRY";

  useEffect(() => {
    setTyped("");
    let i = 0;
    const iv = setInterval(() => {
      setTyped(subtitle.slice(0, ++i));
      if (i >= subtitle.length) clearInterval(iv);
    }, 28);
    return () => clearInterval(iv);
  }, [mode]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("SUBJECT ID AND ACCESS CODE REQUIRED");
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "AUTHENTICATION FAILED — THE GATE REMAINS CLOSED"); return; }
      onLogin(data);
    } catch {
      setError("SIGNAL LOST — CONNECTION TO HAWKINS LAB SEVERED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel-terminal" style={{ position: "relative" }}>
      <div style={{
        position: "absolute", inset: "-30px",
        background: "radial-gradient(ellipse at center, rgba(183,28,28,0.05) 0%, transparent 70%)",
        pointerEvents: "none",
      }}/>

      {/* Terminal header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        marginBottom: "1.4rem",
        paddingBottom: "0.75rem",
        borderBottom: "1px solid rgba(127,0,0,0.25)",
      }}>
        <div style={{ display:"flex", gap:"5px" }}>
          {["rgba(255,60,60,0.7)","rgba(255,160,0,0.7)","rgba(0,230,118,0.7)"].map((c,i) => (
            <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:c, boxShadow:`0 0 6px ${c}` }}/>
          ))}
        </div>
        <div style={{
          flex: 1, textAlign:"center",
          fontFamily:"var(--font-mono)",
          fontSize:"0.58rem",
          color:"var(--text-muted)",
          letterSpacing:"0.18em",
        }}>
          HAWKINS NATIONAL LABORATORY — SUBJECT TERMINAL
        </div>
        <div style={{
          width:7, height:7,
          borderRadius:"50%",
          background:"var(--bright)",
          boxShadow:"0 0 8px var(--bright), 0 0 16px rgba(239,83,80,0.4)",
          animation:"breathe 2s ease-in-out infinite",
          flexShrink:0,
        }}/>
      </div>

      {/* Boot sequence */}
      <div style={{
        fontFamily:"var(--font-mono)",
        fontSize:"var(--fs-xs)",
        color:"var(--text-muted)",
        letterSpacing:"0.1em",
        lineHeight: 1.8,
        marginBottom:"1.5rem",
      }}>
        <div>&gt; DIMENSIONAL UPLINK ... <span style={{color:"var(--success)"}}>ESTABLISHED</span></div>
        <div>&gt; GATE STATUS ......... <span style={{color:"var(--bright)"}}>UNSTABLE</span></div>
        <div style={{ minHeight:"1.2em" }}>
          &gt; <span style={{color:"var(--text-primary)"}}>{typed}</span>
          {typed.length < subtitle.length && <Cursor/>}
        </div>
      </div>

      {error && (
        <div className="msg-error" style={{ fontFamily:"var(--font-mono)" }}>
          ⚠ {error}
        </div>
      )}

      <form onSubmit={submit}>
        <div className="form-group">
          <TLabel>subject_id</TLabel>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="enter subject designation..."
            autoComplete="username"
            style={{
              fontFamily:"var(--font-mono)",
              background:"#0a0a0a",
              borderColor:"rgba(127,0,0,0.3)",
              color:"var(--text-primary)",
              caretColor:"var(--bright)",
            }}
          />
        </div>
        <div className="form-group">
          <TLabel>access_code</TLabel>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            style={{
              fontFamily:"var(--font-mono)",
              background:"#0a0a0a",
              borderColor:"rgba(127,0,0,0.3)",
              color:"var(--text-primary)",
              caretColor:"var(--bright)",
            }}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full"
          style={{ marginTop:"0.5rem", padding:"0.82rem", fontSize:"var(--fs-xs)", letterSpacing:"0.2em" }}
          disabled={loading}
        >
          {loading
            ? "> OPENING THE GATE..."
            : mode === "login"
            ? "⚡ ENTER THE UPSIDE DOWN ⚡"
            : "⚡ REGISTER AS SUBJECT ⚡"}
        </button>
      </form>

      <div style={{
        marginTop:"1.4rem",
        paddingTop:"0.8rem",
        borderTop:"1px solid rgba(127,0,0,0.15)",
        display:"flex",
        alignItems:"center",
        justifyContent:"space-between",
        flexWrap:"wrap",
        gap:"0.5rem",
      }}>
        <div style={{
          fontFamily:"var(--font-mono)",
          fontSize:"0.6rem",
          color:"var(--text-muted)",
          letterSpacing:"0.1em",
          opacity: 0.6,
        }}>
          {mode === "login" ? "NEW TO THE PARTY?" : "RETURNING SUBJECT?"}
        </div>
        <button
          className="btn btn-terminal"
          style={{ fontSize:"0.68rem", padding:"0.28rem 0.7rem" }}
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
        >
          {mode === "login" ? "> JOIN THE PARTY" : "> AUTHENTICATE"}
        </button>
      </div>

      <div style={{
        marginTop:"var(--sp-md)",
        fontFamily:"var(--font-mono)",
        fontSize:"0.54rem",
        color:"rgba(127,0,0,0.3)",
        letterSpacing:"0.25em",
        textAlign:"center",
      }}>
        ▽ HAWKINS LAB · PROJECT INDIGO · DR. BRENNER ▽
      </div>
    </div>
  );
}