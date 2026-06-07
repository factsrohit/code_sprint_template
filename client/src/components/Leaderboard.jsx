import React, { useState, useEffect } from "react";

const RANK_ICONS  = ["👑", "⚔️", "🛡️"];
const RANK_LABELS = ["DUNGEON MASTER", "PARTY LEADER", "CHIEF"];
const RANK_COLORS = ["#ef5350","#ff7043","#ffab91"];
const RANK_GLOW   = [
  "0 0 4px #ef5350, 0 0 12px #b71c1c, 0 0 30px rgba(127,0,0,0.53)",
  "0 0 10px rgba(255,112,67,0.4)",
  "0 0 8px rgba(255,171,145,0.3)",
];

export default function Leaderboard({ fullPage }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      setData(await res.json());
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={fullPage ? { maxWidth: 780, margin: "0 auto" } : {}}>

      {/* Header */}
      <div className="flex-between" style={{ marginBottom:"var(--sp-md)", flexWrap:"wrap", gap:"0.5rem" }}>
        <div>
          <h2 className="neon-red" style={{
            fontFamily:"var(--font-title)",
            fontSize: fullPage ? "var(--fs-xl)" : "var(--fs-lg)",
            letterSpacing:"0.08em",
          }}>
            🎲 THE PARTY RANKINGS
          </h2>
          {fullPage && (
            <div style={{
              fontFamily:"var(--font-mono)",
              fontSize:"var(--fs-xs)",
              color:"var(--text-muted)",
              marginTop:"0.3rem",
              letterSpacing:"0.12em",
            }}>
              HAWKINS, INDIANA · CAMPAIGN STANDINGS
            </div>
          )}
        </div>
        <button className="btn btn-ghost" style={{fontSize:"var(--fs-xs)",padding:"0.3rem 0.75rem"}} onClick={load}>
          ↻ REFRESH SCAN
        </button>
      </div>

      {loading ? (
        <div className="loading">SCANNING THE UPSIDE DOWN</div>
      ) : data.length === 0 ? (
        <div className="panel-document" style={{ textAlign:"center", padding:"var(--sp-xl)" }}>
          <div style={{ fontSize:"2.2rem", marginBottom:"0.6rem", opacity:0.28 }}>🎲</div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-sm)", color:"var(--text-muted)", lineHeight:2 }}>
            The Party has no members yet.<br/>No one has entered the Upside Down.
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.55rem" }}>

          {/* Top 3 — The Party's best */}
          {data.slice(0, Math.min(3, data.length)).map((user, i) => (
            <div
              key={user.id}
              className="panel-glow"
              style={{
                padding:"0.9rem 1.1rem",
                display:"flex",
                alignItems:"center",
                gap:"1rem",
                background: i === 0 ? "#1a0000" : i <= 2 ? "#120000" : undefined,
                borderColor: i===0
                  ? "var(--border-glow)"
                  : i===1
                  ? "rgba(255,112,67,0.3)"
                  : "rgba(255,171,145,0.2)",
                animationDelay:`${i*0.4}s`,
              }}
            >
              <div style={{
                fontSize: i===0 ? "1.5rem" : "1.1rem",
                minWidth:40,
                textAlign:"center",
                flexShrink:0,
              }}>
                {RANK_ICONS[i]}
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                <div className={i === 0 ? "lb-name" : ""} style={{
                  fontFamily: i === 0 ? "var(--font-title)" : "var(--font-body)",
                  fontSize: i===0 ? "var(--fs-md)" : "var(--fs-sm)",
                  fontWeight: i === 0 ? 400 : 600,
                  color:RANK_COLORS[i],
                  letterSpacing:"0.1em",
                  textShadow: i === 0 ? RANK_GLOW[0] : RANK_GLOW[i],
                  overflow:"hidden",
                  textOverflow:"ellipsis",
                  whiteSpace:"nowrap",
                }}>
                  {user.username}
                </div>
                <div style={{
                  fontFamily:"var(--font-mono)",
                  fontSize:"0.58rem",
                  color: i===0 ? "rgba(239,83,80,0.55)" : "var(--text-muted)",
                  letterSpacing:"0.16em",
                  marginTop:"0.15rem",
                }}>
                  {RANK_LABELS[i]}
                </div>
              </div>

              <span className="badge badge-pts" style={{
                fontSize: i===0 ? "var(--fs-xs)" : "0.72rem",
                padding:"0.32rem 0.75rem",
                boxShadow: i===0 ? "0 0 18px rgba(183,28,28,0.35)" : undefined,
              }}>
                {user.total} XP
              </span>
            </div>
          ))}

          {/* Rest — fellow party members */}
          {data.length > 3 && (
            <div className="panel-document" style={{ marginTop:"0.4rem", padding:"0.5rem 0" }}>
              <div style={{
                fontFamily:"var(--font-mono)",
                fontSize:"0.6rem",
                color:"var(--text-muted)",
                letterSpacing:"0.2em",
                padding:"0.4rem 1rem 0.6rem",
                borderBottom:"1px solid var(--border)",
              }}>
                — THE REST OF THE PARTY —
              </div>
              {data.slice(3).map((user, i) => (
                <div key={user.id} style={{
                  display:"flex",
                  alignItems:"center",
                  gap:"0.75rem",
                  padding:"0.55rem 1rem",
                  borderBottom: i < data.length-4 ? "1px solid rgba(42,26,26,0.4)" : "none",
                  transition:"background 0.25s",
                }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(183,28,28,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background="transparent"}
                >
                  <div style={{
                    fontFamily:"var(--font-mono)",
                    fontSize:"0.68rem",
                    color:"var(--text-muted)",
                    minWidth:22,
                    textAlign:"right",
                    flexShrink:0,
                  }}>
                    {i + 4}
                  </div>
                  <div style={{
                    flex:1,
                    fontFamily:"var(--font-mono)",
                    fontSize:"var(--fs-sm)",
                    color:"var(--text-primary)",
                    overflow:"hidden",
                    textOverflow:"ellipsis",
                    whiteSpace:"nowrap",
                  }}>
                    {user.username}
                  </div>
                  <span className="badge badge-pts" style={{ fontSize:"0.7rem" }}>
                    {user.total} XP
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{
        marginTop:"var(--sp-sm)",
        fontFamily:"var(--font-mono)",
        fontSize:"0.58rem",
        color:"var(--text-muted)",
        textAlign:"right",
        letterSpacing:"0.1em",
        display:"flex",
        alignItems:"center",
        justifyContent:"flex-end",
        gap:"0.4rem",
      }}>
        <span style={{
          display:"inline-block",
          width:6, height:6, borderRadius:"50%",
          background:"var(--bright)",
          animation:"blink-dot 1.5s ease-in-out infinite",
          boxShadow:"0 0 6px var(--bright)",
        }}/>
        AUTO-REFRESH · LIVE · 30s
      </div>
    </div>
  );
}