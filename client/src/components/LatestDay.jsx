import React, { useState, useEffect } from "react";

export default function LatestDay({ auth }) {
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState({});
  const [messages,    setMessages]    = useState({});
  const [showDesc,    setShowDesc]    = useState({});
  const [visitedSolve,setVisitedSolve]= useState({});
  const [confirmDone, setConfirmDone] = useState(null);

  const fetchLatest = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/days/latest", {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const json = await res.json();
      setData(json);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLatest(); }, []);

  const markDone = async (problem) => {
    setSubmitting(s => ({ ...s, [problem.id]: true }));
    try {
      const res  = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ problem_id: problem.id }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessages(m => ({ ...m, [problem.id]: `✓ Gate closed! +${json.points} XP earned` }));
        setData(d  => ({ ...d, solvedIds: [...d.solvedIds, problem.id] }));
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

  if (loading) return <div className="loading">SCANNING THE UPSIDE DOWN</div>;

  if (!data) return (
    <div className="panel-document" style={{ textAlign:"center", padding:"3rem" }}>
      <div style={{
        fontFamily:"var(--font-title)",
        fontSize:"var(--fs-lg)",
        color:"rgba(183,28,28,0.32)",
        marginBottom:"0.6rem",
        textShadow:"0 0 18px rgba(183,28,28,0.15)",
      }}>
        NO ACTIVE ENCOUNTERS
      </div>
      <div style={{
        color:"var(--text-muted)",
        fontFamily:"var(--font-mono)",
        fontSize:"var(--fs-sm)",
        lineHeight:1.8,
      }}>
        No chapters have been opened yet.<br/>
        The Upside Down is quiet... for now.
      </div>
    </div>
  );

  const { day, problems, solvedIds: allSolvedIds } = data;
  // Filter to only count problems solved in THIS day's problem set
  const todayProblemIds = new Set(problems.map(p => p.id));
  const solvedIds = allSolvedIds.filter(id => todayProblemIds.has(id));
  const isClosed  = !day.is_open;
  const pctDone   = problems.length ? (solvedIds.length / problems.length) * 100 : 0;

  return (
    <div>
      {/* ── Chapter dossier header ────────────────────────────────────── */}
      <div className="panel-dossier" style={{ marginBottom:"1.5rem" }}>
        <div style={{
          display:"flex",
          alignItems:"flex-start",
          justifyContent:"space-between",
          flexWrap:"wrap",
          gap:"0.75rem",
          marginTop:"0.8rem",
        }}>
          <div>
            <div style={{
              fontFamily:"var(--font-mono)",
              fontSize:"0.62rem",
              color:"var(--text-muted)",
              letterSpacing:"0.22em",
              marginBottom:"0.4rem",
            }}>
              ◆ ACTIVE CAMPAIGN — CHAPTER {day.day_number}
            </div>
            <h2 className="neon-red" style={{
              fontFamily:"var(--font-title)",
              fontSize:"var(--fs-xl)",
              letterSpacing:"0.08em",
              lineHeight:1.1,
            }}>
              {day.title.toUpperCase()}
            </h2>
            <div style={{
              fontFamily:"var(--font-mono)",
              fontSize:"0.62rem",
              color:"var(--text-muted)",
              letterSpacing:"0.1em",
              marginTop:"0.4rem",
            }}>
              CAMPAIGN STARTED: {new Date(day.started_at).toLocaleString()}
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"0.5rem" }}>
            <span className={`badge ${isClosed ? "badge-closed" : "badge-open"}`} style={{
              fontSize:"0.72rem",
              padding:"0.3rem 0.8rem",
              letterSpacing:"0.15em",
            }}>
              {isClosed ? "🔒 SEALED" : "🌀 GATE OPEN"}
            </span>
            <span className="evidence-tag">{`ENCOUNTERS: ${solvedIds.length}/${problems.length}`}</span>
          </div>
        </div>

        {/* Campaign progress */}
        <div style={{ marginTop:"1rem" }}>
          <div style={{
            display:"flex", justifyContent:"space-between",
            fontFamily:"var(--font-mono)", fontSize:"0.6rem",
            color:"var(--text-muted)", marginBottom:"0.4rem",
          }}>
            <span>GATE CLOSURE PROGRESS</span>
            <span style={{ color:"var(--bright)" }}>{Math.round(pctDone)}% GATES CLOSED</span>
          </div>
          <div style={{
            height:5,
            background:"rgba(255,255,255,0.04)",
            borderRadius:3,
            overflow:"hidden",
          }}>
            <div className="progress-bar-fill" style={{
              height:"100%",
              width:`${Math.max(pctDone > 0 ? 2 : 0, pctDone)}%`,
            }}/>
          </div>
        </div>
      </div>

      {/* ── Evidence photo ────────────────────────────────────────────── */}
      {day.poster_path && (
        <div style={{
          marginBottom:"1.5rem",
          borderRadius:5,
          overflow:"hidden",
          border:"1px solid var(--border)",
          boxShadow:"0 0 30px rgba(0,0,0,0.65), 0 0 0 1px rgba(183,28,28,0.08)",
        }}>
          <img
            src={`/uploads/${day.poster_path}`}
            alt="Chapter evidence"
            style={{
              width:"100%",
              maxHeight:520,
              objectFit:"contain",
              background:"var(--bg)",
              filter:"brightness(0.88) contrast(1.08) saturate(0.9)",
            }}
          />
        </div>
      )}

      {/* ── Classified Intel / Briefing ───────────────────────────────── */}
      {day.reading_material && (
        <div className="panel-document" style={{ marginBottom:"1.5rem" }}>
          <div style={{
            fontFamily:"var(--font-title)",
            fontSize:"var(--fs-xs)",
            letterSpacing:"0.12em",
            color:"var(--text-muted)",
            marginBottom:"0.85rem",
            textTransform:"uppercase",
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
            {day.reading_material}
          </div>
        </div>
      )}

      {/* ── Encounters (problems) ─────────────────────────────────────── */}
      <div>
        <div style={{
          fontFamily:"var(--font-title)",
          fontSize:"var(--fs-sm)",
          letterSpacing:"0.1em",
          color:"var(--text-muted)",
          marginBottom:"1rem",
          display:"flex",
          alignItems:"center",
          gap:"0.6rem",
        }}>
          <span>🌀 ENCOUNTERS</span>
          <div style={{
            flex:1, height:1,
            background:"linear-gradient(90deg, rgba(183,28,28,0.2), transparent)",
          }}/>
          <span style={{ color:"var(--bright)", fontSize:"var(--fs-xs)", fontFamily:"var(--font-mono)" }}>
            {solvedIds.length}/{problems.length} GATES CLOSED
          </span>
        </div>

        {problems.map((problem, i) => {
          const solved = solvedIds.includes(problem.id);
          const msg    = messages[problem.id];

          return (
            <div
              key={problem.id}
              className={`panel ${solved ? "problem-solved" : ""}`}
              style={{
                marginBottom:"0.85rem",
                borderColor: solved
                  ? "#006622"
                  : isClosed
                  ? "rgba(42,26,26,0.5)"
                  : "var(--border)",
                opacity: isClosed && !solved ? 0.7 : 1,
                transition:"all 0.4s ease",
              }}
            >
              {/* Encounter header row */}
              <div className="flex-between" style={{ flexWrap:"wrap", gap:"0.5rem" }}>

                <div style={{ flex:1, minWidth:0 }}>
                  <div className="flex gap-sm" style={{ alignItems:"center", flexWrap:"wrap" }}>
                    <span style={{
                      fontFamily:"var(--font-mono)",
                      fontSize:"0.65rem",
                      color:"var(--text-muted)",
                      minWidth:26,
                      flexShrink:0,
                    }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className={solved ? "problem-name" : ""} style={{
                      fontFamily:"var(--font-title)",
                      fontSize:"var(--fs-md)",
                      color: solved ? "var(--success)" : "var(--text-bright)",
                      letterSpacing:"0.06em",
                      textShadow: solved ? "0 0 8px rgba(0,230,118,0.27)" : "none",
                    }}>
                      {problem.name}
                    </span>
                    {solved && (
                      <span style={{
                        color:"var(--success)",
                        fontSize:"1rem",
                        textShadow:"0 0 12px rgba(0,230,118,0.55)",
                        animation:"breathe 2s ease-in-out infinite",
                      }}>✓</span>
                    )}
                    <span className="badge badge-pts" style={{ fontSize:"0.65rem" }}>
                      {problem.points ?? "?"} XP
                    </span>
                  </div>

                  {msg && (
                    <div style={{
                      fontFamily:"var(--font-mono)",
                      fontSize:"var(--fs-xs)",
                      color: msg.startsWith("✓") ? "var(--success)" : "var(--bright)",
                      textShadow: msg.startsWith("✓") ? "0 0 8px rgba(0,230,118,0.3)" : "0 0 8px rgba(183,28,28,0.25)",
                      marginTop:"0.35rem",
                      marginLeft:34,
                    }}>
                      {msg}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
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
                    const hasSolveLink  = !!problem.external_link;
                    const canMarkDone   = solved || !hasSolveLink || visitedSolve[problem.id];
                    if (solved) return (
                      <button className="btn btn-done" disabled>GATE CLOSED ✓</button>
                    );
                    if (isClosed) return (
                      <button className="btn btn-done" disabled>SEALED</button>
                    );
                    if (!canMarkDone) return (
                      <button className="btn btn-done" disabled style={{ opacity:0.6 }}>ENTER GATE FIRST</button>
                    );
                    if (confirmDone === problem.id) return (
                      <div className="flex gap-sm" style={{ alignItems:"center" }}>
                        <button
                          className="btn btn-danger"
                          style={{ fontSize:"0.7rem" }}
                          disabled={submitting[problem.id]}
                          onClick={() => markDone(problem)}
                        >
                          {submitting[problem.id] ? "..." : "CONFIRM CLOSURE"}
                        </button>
                        <button
                          className="btn btn-ghost"
                          style={{ fontSize:"0.7rem" }}
                          onClick={() => setConfirmDone(null)}
                        >STAND DOWN</button>
                      </div>
                    );
                    return (
                      <button
                        className="btn btn-success"
                        disabled={submitting[problem.id]}
                        onClick={() => setConfirmDone(problem.id)}
                      >
                        CLOSE GATE
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* Declassified intel */}
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
    </div>
  );
}