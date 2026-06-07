import React, { useState, useEffect } from "react";

export default function PreviousDays({ auth }) {
  const [days,        setDays]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [submitting,  setSubmitting]  = useState({});
  const [messages,    setMessages]    = useState({});
  const [showDesc,    setShowDesc]    = useState({});
  const [solvedIds,   setSolvedIds]   = useState(new Set());
  const [visitedSolve,setVisitedSolve]= useState({});
  const [confirmDone, setConfirmDone] = useState(null);

  const fetchDays = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/days", { headers: { Authorization: `Bearer ${auth.token}` } });
      const json = await res.json();
      setDays(json);
      const solved = new Set();
      json.forEach(d => d.solvedIds.forEach(id => solved.add(id)));
      setSolvedIds(solved);
      if (json.length > 0 && !selectedDay) {
        setSelectedDay(json.length > 1 ? json[json.length - 2] : json[0]);
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDays(); }, []);

  const markDone = async (problem, dayItem) => {
    if (!dayItem.day.is_open) return;
    setSubmitting(s => ({ ...s, [problem.id]: true }));
    try {
      const res  = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ problem_id: problem.id }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessages(m => ({ ...m, [problem.id]: `✓ +${json.points} XP earned` }));
        setSolvedIds(s => new Set([...s, problem.id]));
      } else {
        setMessages(m => ({ ...m, [problem.id]: `✗ ${json.error}` }));
      }
    } catch {
      setMessages(m => ({ ...m, [problem.id]: "✗ The Upside Down interfered — submission rejected" }));
    } finally {
      setSubmitting(s => ({ ...s, [problem.id]: false }));
      setConfirmDone(null);
    }
  };

  if (loading) return <div className="loading">RETRIEVING CLOSED CHAPTERS</div>;

  if (days.length === 0) return (
    <div className="panel-document" style={{ textAlign:"center", padding:"3rem" }}>
      <div style={{
        color:"var(--text-muted)",
        fontFamily:"var(--font-mono)",
        letterSpacing:"0.1em",
        lineHeight:1.8,
      }}>
        No chapters exist in the archive yet.
      </div>
    </div>
  );

  return (
    <div
      style={{
        display:"grid",
        gridTemplateColumns:"clamp(165px,26vw,230px) 1fr",
        gap:"clamp(0.75rem,2vw,1.5rem)",
        alignItems:"start",
      }}
      className="prev-days-grid"
    >
      <style>{`@media(max-width:600px){.prev-days-grid{grid-template-columns:1fr!important}}`}</style>

      {/* ── Sidebar — Chapter archive index ──────────────────────────── */}
      <div>
        <div style={{
          fontFamily:"var(--font-mono)",
          fontSize:"0.62rem",
          letterSpacing:"0.2em",
          color:"var(--text-muted)",
          marginBottom:"0.8rem",
          textTransform:"uppercase",
        }}>
          📕 CHAPTER ARCHIVE
        </div>

        {days.map(dayItem => {
          const solved = dayItem.problems.filter(p => solvedIds.has(p.id)).length;
          const total  = dayItem.problems.length;
          const active = selectedDay?.day.id === dayItem.day.id;
          const pct    = total ? (solved / total) * 100 : 0;

          return (
            <div
              key={dayItem.day.id}
              onClick={() => setSelectedDay(dayItem)}
              className="pointer"
              style={{
                padding:"0.72rem 0.85rem",
                borderRadius:3,
                marginBottom:"0.45rem",
                background: active ? "rgba(183,28,28,0.1)" : "var(--surface)",
                border: active ? "1px solid var(--border-glow)" : "1px solid var(--border)",
                boxShadow: active ? "0 0 18px rgba(183,28,28,0.12)" : "none",
                transition:"all 0.3s ease",
                position:"relative",
                overflow:"hidden",
              }}
            >
              {active && (
                <div style={{
                  position:"absolute", left:0, top:0, bottom:0, width:"3px",
                  background:"linear-gradient(to bottom, var(--bright), var(--primary))",
                  boxShadow:"0 0 10px rgba(239,83,80,0.55)",
                }}/>
              )}

              <div style={{
                fontFamily:"var(--font-title)",
                fontSize:"0.82rem",
                color: active ? "var(--bright)" : "var(--text-primary)",
                letterSpacing:"0.08em",
                textShadow: active ? "0 0 12px rgba(183,28,28,0.4)" : "none",
              }}>
                CHAPTER {dayItem.day.day_number}
              </div>
              <div style={{
                fontFamily:"var(--font-mono)",
                fontSize:"0.68rem",
                color:"var(--text-muted)",
                marginTop:"0.18rem",
                whiteSpace:"nowrap",
                overflow:"hidden",
                textOverflow:"ellipsis",
              }}>
                {dayItem.day.title}
              </div>

              {/* Mini progress bar */}
              <div style={{
                height:2, background:"rgba(255,255,255,0.04)",
                borderRadius:1, overflow:"hidden", margin:"0.45rem 0 0.3rem",
              }}>
                <div style={{
                  height:"100%",
                  width:`${pct}%`,
                  background: pct===100 ? "linear-gradient(90deg,#003300,#00AA44)" : "linear-gradient(90deg,var(--border-glow),var(--bright))",
                  boxShadow: pct===100 ? "0 0 8px rgba(0,200,80,0.4)" : "0 0 8px rgba(183,28,28,0.4)",
                  transition:"width 0.6s ease",
                  borderRadius:1,
                }}/>
              </div>

              <div className="flex-between">
                <span style={{
                  fontFamily:"var(--font-mono)",
                  fontSize:"0.65rem",
                  color:"var(--text-muted)",
                }}>
                  {solved}/{total} gates closed
                </span>
                <span className={`badge ${dayItem.day.is_open ? "badge-open" : "badge-closed"}`}
                  style={{ fontSize:"0.6rem", padding:"0.15rem 0.45rem" }}>
                  {dayItem.day.is_open ? "OPEN" : "SEALED"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main area — selected chapter ──────────────────────────────── */}
      {selectedDay && (
        <div>
          {/* Chapter header */}
          <div className="panel-dossier" style={{ marginBottom:"1.2rem" }}>
            <div style={{ marginTop:"0.8rem" }} className="flex-between">
              <div>
                <div style={{
                  fontFamily:"var(--font-mono)",
                  fontSize:"0.6rem",
                  color:"var(--text-muted)",
                  letterSpacing:"0.22em",
                  marginBottom:"0.35rem",
                }}>
                  ◆ CHAPTER ARCHIVE — CHAPTER {selectedDay.day.day_number}
                </div>
                <h3 className="neon-red" style={{
                  fontFamily:"var(--font-title)",
                  fontSize:"var(--fs-lg)",
                  letterSpacing:"0.08em",
                }}>
                  {selectedDay.day.title.toUpperCase()}
                </h3>
                <div style={{
                  fontFamily:"var(--font-mono)",
                  fontSize:"0.6rem",
                  color:"var(--text-muted)",
                  marginTop:"0.3rem",
                }}>
                  CAMPAIGN STARTED: {new Date(selectedDay.day.started_at).toLocaleString()}
                </div>
              </div>
              <span className={`badge ${selectedDay.day.is_open ? "badge-open" : "badge-closed"}`}
                style={{ flexShrink:0, alignSelf:"flex-start" }}>
                {selectedDay.day.is_open ? "🌀 GATE OPEN" : "🔒 SEALED"}
              </span>
            </div>
          </div>

          {/* Dungeon Master's Briefing */}
          {selectedDay.day.reading_material && (
            <div className="panel-document" style={{ marginBottom:"1.2rem" }}>
              <div style={{
                fontFamily:"var(--font-title)",
                fontSize:"var(--fs-xs)",
                color:"var(--text-muted)",
                letterSpacing:"0.12em",
                marginBottom:"0.85rem",
              }}>
                📜 DUNGEON MASTER'S BRIEFING
              </div>
              <div style={{
                fontFamily:"var(--font-mono)",
                fontSize:"var(--fs-sm)",
                color:"var(--text-muted)",
                whiteSpace:"pre-wrap",
                lineHeight:1.85,
              }}>
                {selectedDay.day.reading_material}
              </div>
            </div>
          )}

          {/* Encounters */}
          <div style={{
            fontFamily:"var(--font-title)",
            fontSize:"var(--fs-xs)",
            letterSpacing:"0.1em",
            color:"var(--text-muted)",
            marginBottom:"0.85rem",
            display:"flex", alignItems:"center", gap:"0.6rem",
          }}>
            <span>🌀 ENCOUNTERS</span>
            <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(183,28,28,0.18),transparent)" }}/>
          </div>

          {selectedDay.problems.map((problem, i) => {
            const solved = solvedIds.has(problem.id);
            const msg    = messages[problem.id];
            const closed = !selectedDay.day.is_open;

            return (
              <div
                key={problem.id}
                className={`panel ${solved ? "problem-solved" : ""}`}
                style={{
                  marginBottom:"0.75rem",
                  borderColor: solved ? "#006622" : "var(--border)",
                  transition:"all 0.4s ease",
                }}
              >
                <div className="flex-between" style={{ flexWrap:"wrap", gap:"0.5rem" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="flex gap-sm" style={{ alignItems:"center", flexWrap:"wrap" }}>
                      <span style={{
                        fontFamily:"var(--font-mono)",
                        fontSize:"0.65rem",
                        color:"var(--text-muted)",
                        minWidth:24, flexShrink:0,
                      }}>
                        {String(i+1).padStart(2,"0")}
                      </span>
                      <span className={solved ? "problem-name" : ""} style={{
                        fontFamily:"var(--font-title)",
                        fontSize:"var(--fs-sm)",
                        color: solved ? "var(--success)" : "var(--text-bright)",
                        letterSpacing:"0.06em",
                        textShadow: solved ? "0 0 8px rgba(0,230,118,0.27)" : "none",
                      }}>
                        {problem.name}
                      </span>
                      {solved && (
                        <span style={{
                          color:"var(--success)",
                          textShadow:"0 0 12px rgba(0,230,118,0.55)",
                          animation:"breathe 2s ease-in-out infinite",
                        }}>✓</span>
                      )}
                    </div>
                    {msg && (
                      <div style={{
                        fontFamily:"var(--font-mono)",
                        fontSize:"var(--fs-xs)",
                        color: msg.startsWith("✓") ? "var(--success)" : "var(--bright)",
                        marginTop:"0.3rem", marginLeft:34,
                        textShadow: msg.startsWith("✓") ? "0 0 8px rgba(0,230,118,0.3)" : "0 0 8px rgba(183,28,28,0.2)",
                      }}>{msg}</div>
                    )}
                  </div>

                  <div className="flex gap-sm" style={{ alignItems:"center", flexShrink:0, flexWrap:"wrap" }}>
                    {problem.description && (
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize:"0.62rem", padding:"0.22rem 0.55rem" }}
                        onClick={() => setShowDesc(s => ({ ...s, [problem.id]: !s[problem.id] }))}
                      >
                        {showDesc[problem.id] ? "HIDE INTEL" : "VIEW INTEL"}
                      </button>
                    )}
                    {problem.external_link && (
                      <a
                        href={problem.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost"
                        style={{ fontSize:"0.62rem", padding:"0.22rem 0.55rem", textDecoration:"none" }}
                        onClick={() => setVisitedSolve(s => ({ ...s, [problem.id]: true }))}
                      >
                        ENTER GATE ↗
                      </a>
                    )}
                    {(() => {
                      const hasSolveLink = !!problem.external_link;
                      const canMarkDone  = solved || !hasSolveLink || visitedSolve[problem.id];
                      if (solved)      return <button className="btn btn-done" disabled>GATE CLOSED ✓</button>;
                      if (closed)      return <button className="btn btn-done" disabled>SEALED</button>;
                      if (!canMarkDone)return <button className="btn btn-done" disabled style={{opacity:0.6}}>ENTER GATE FIRST</button>;
                      if (confirmDone === problem.id) return (
                        <div className="flex gap-sm" style={{ alignItems:"center" }}>
                          <button className="btn btn-danger" style={{fontSize:"0.7rem"}}
                            disabled={submitting[problem.id]}
                            onClick={() => markDone(problem, selectedDay)}>
                            {submitting[problem.id] ? "..." : "CONFIRM CLOSURE"}
                          </button>
                          <button className="btn btn-ghost" style={{fontSize:"0.7rem"}}
                            onClick={() => setConfirmDone(null)}>
                            STAND DOWN
                          </button>
                        </div>
                      );
                      return (
                        <button className="btn btn-success" style={{fontSize:"0.7rem"}}
                          disabled={submitting[problem.id]}
                          onClick={() => setConfirmDone(problem.id)}>
                          CLOSE GATE
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {showDesc[problem.id] && problem.description && (
                  <div style={{
                    marginTop:"0.85rem",
                    paddingTop:"0.85rem",
                    borderTop:"1px solid rgba(42,26,26,0.3)",
                    fontFamily:"var(--font-mono)",
                    fontSize:"var(--fs-sm)",
                    color:"var(--text-muted)",
                    whiteSpace:"pre-wrap",
                    lineHeight:1.85,
                  }}>
                    {problem.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}