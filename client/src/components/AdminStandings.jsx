import React, { useState, useEffect } from "react";

export default function AdminStandings({ auth }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [undoing, setUndoing] = useState({});

  const fetchStandings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/standings", {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setData(await res.json());
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchStandings();
  }, []);

  const undoSubmission = async (userId, problemId) => {
    const key = `${userId}_${problemId}`;
    setUndoing((u) => ({ ...u, [key]: true }));
    try {
      await fetch("/api/admin/submissions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ user_id: userId, problem_id: problemId }),
      });
      fetchStandings();
    } catch {}
    finally { setUndoing((u) => ({ ...u, [key]: false })); }
  };

  if (loading) return <div className="loading">SCANNING THE PARTY RECORDS</div>;
  if (!data) return <div className="msg-error">Party records unavailable. The Upside Down interferes.</div>;

  const { standings, problems, days } = data;

  // Group problems by day
  const dayMap = {};
  days.forEach((d) => (dayMap[d.id] = d));
  const problemsByDay = {};
  problems.forEach((p) => {
    if (!problemsByDay[p.day_id]) problemsByDay[p.day_id] = [];
    problemsByDay[p.day_id].push(p);
  });

  const sortedDays = [...days].sort((a, b) => a.day_number - b.day_number);
  const sortedStandings = [...standings].sort((a, b) => b.total - a.total);

  return (
    <div>
      <div className="flex-between mb-md">
        <h3 className="neon-red" style={{
          fontFamily: "var(--font-title)",
          fontSize: "var(--fs-md)",
          letterSpacing: "0.1em",
        }}>
          🎲 THE PARTY · ALL SUBJECTS
        </h3>
        <button
          className="btn btn-ghost"
          style={{ fontSize: "0.7rem" }}
          onClick={fetchStandings}
        >
          ↻ REFRESH SCAN
        </button>
      </div>

      <div
        style={{
          overflowX: "auto",
          borderRadius: "4px",
          border: "1px solid var(--border)",
          boxShadow: "0 0 20px rgba(0,0,0,0.5)",
        }}
      >
        <table className="data-table standings-table" style={{ minWidth: 800 }}>
          <thead>
            <tr>
              <th style={{ minWidth: 50, borderBottom: "1px solid var(--border-glow)" }}>
                RANK
              </th>
              <th style={{ minWidth: 160, borderBottom: "1px solid var(--border-glow)" }}>
                PARTY MEMBER
              </th>
              {sortedDays.map((day) =>
                (problemsByDay[day.id] || []).map((p) => (
                  <th
                    key={p.id}
                    className="day-header"
                    style={{
                      minWidth: 100,
                      textAlign: "center",
                      borderBottom: "1px solid var(--border-glow)",
                      background: "var(--surface)",
                    }}
                  >
                    <div
                      style={{
                        color: "var(--bright)",
                        fontSize: "0.65rem",
                        letterSpacing: "0.1em",
                        opacity: 0.7,
                      }}
                    >
                      CHAPTER {day.day_number}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 90,
                        margin: "0 auto",
                      }}
                    >
                      {p.name}
                    </div>
                  </th>
                ))
              )}
              <th
                style={{
                  textAlign: "right",
                  minWidth: 90,
                  borderBottom: "1px solid var(--border-glow)",
                }}
              >
                TOTAL XP
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStandings.map((user, rank) => (
              <tr
                key={user.id}
                style={{
                  background:
                    rank === 0
                      ? "#1a0000"
                      : rank <= 2
                      ? "#120000"
                      : rank % 2 === 0
                      ? "rgba(14,14,14,0.3)"
                      : "transparent",
                }}
              >
                <td
                  style={{
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-title)",
                    fontSize: "0.9rem",
                  }}
                >
                  {rank + 1}
                </td>
                <td
                  style={{
                    fontFamily: rank === 0 ? "var(--font-title)" : "var(--font-body)",
                    color: rank === 0 ? "var(--bright)" : "var(--text-primary)",
                    textShadow: rank === 0 ? "0 0 4px #ef5350, 0 0 12px #b71c1c" : "none",
                    letterSpacing: "0.06em",
                    fontSize: "0.9rem",
                  }}
                >
                  {user.username}
                </td>
                {sortedDays.map((day) =>
                  (problemsByDay[day.id] || []).map((p) => {
                    const pts = user.problemPoints[p.id];
                    const key = `${user.id}_${p.id}`;
                    return (
                      <td
                        key={p.id}
                        style={{
                          textAlign: "center",
                          padding: "0.6rem",
                          borderRight: "1px solid rgba(255,255,255,0.02)",
                        }}
                      >
                        {pts !== null && pts !== undefined ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "0.3rem",
                            }}
                          >
                            <span
                              className="badge badge-pts"
                              style={{ fontSize: "0.75rem", boxShadow: "0 0 5px rgba(183,28,28,0.3)" }}
                            >
                              +{pts}
                            </span>
                            <button
                              className="undo-btn"
                              onClick={() => undoSubmission(user.id, p.id)}
                              disabled={undoing[key]}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--text-muted)",
                                fontSize: "0.6rem",
                                cursor: "pointer",
                                fontFamily: "var(--font-mono)",
                                padding: "0.2rem 0.4rem",
                                borderRadius: "2px",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = "rgba(183,28,28,0.2)";
                                e.target.style.color = "var(--bright)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = "transparent";
                                e.target.style.color = "var(--text-muted)";
                              }}
                              title="Revoke Gate Closure"
                            >
                              {undoing[key] ? "..." : "✕ Revoke"}
                            </button>
                          </div>
                        ) : (
                          <span
                            style={{
                              color: "rgba(122,106,106,0.3)",
                              fontSize: "0.9rem",
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>
                    );
                  })
                )}
                <td style={{ textAlign: "right" }}>
                  <span
                    className="badge badge-pts"
                    style={{
                      fontSize: "0.9rem",
                      padding: "0.3rem 0.6rem",
                      boxShadow: rank === 0 ? "0 0 10px rgba(183,28,28,0.4)" : "none",
                    }}
                  >
                    {user.total}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedStandings.length === 0 && (
        <div
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            padding: "3rem",
            fontSize: "0.85rem",
            letterSpacing: "0.1em",
            border: "1px solid var(--border)",
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
            background: "var(--surface)",
          }}
        >
          No subjects in the Party. The Upside Down remains unconquered.
        </div>
      )}
    </div>
  );
}