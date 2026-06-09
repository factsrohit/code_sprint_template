import React, { useState } from "react";
import LatestDay from "./LatestDay";
import PreviousDays from "./PreviousDays";

const TABS = [
  { key: "latest",   label: "ACTIVE CHAPTER",     icon: "⚡", desc: "Current campaign encounter" },
  { key: "previous", label: "CLOSED CHAPTERS",     icon: "📕", desc: "Previous encounters archive" },
  { key: "progress", label: "CHARACTER SHEET",      icon: "🎲", desc: "My campaign stats" },
  { key: "settings", label: "SETTINGS",             icon: "🔒", desc: "Account settings" },
];

/* ── Character Sheet / Progress view ───────────────────────────────────── */
function ProgressView({ auth }) {
  const [stats, setStats]     = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const headers = { Authorization: `Bearer ${auth.token}` };
        const [progressRes, daysRes, leaderboardRes] = await Promise.all([
          fetch("/api/me/progress", { headers }),
          fetch("/api/days",       { headers }),
          fetch("/api/leaderboard"),
        ]);

        if (!progressRes.ok || !daysRes.ok || !leaderboardRes.ok) return;

        const submissions = await progressRes.json();   // array of { submission, problem, day, points }
        const allDaysData = await daysRes.json();        // array of { day, problems, solvedIds }
        const leaderboard = await leaderboardRes.json(); // array of { id, username, total }

        // Total XP earned
        const totalPoints = submissions.reduce((sum, s) => sum + (s.points || 0), 0);

        // Total problems across ALL days in the campaign
        const totalProblems = allDaysData.reduce((sum, d) => sum + (d.problems?.length || 0), 0);

        // Unique problems solved by this user
        const solvedCount = submissions.length;

        // Campaign completion = solved / total problems across all days
        const completionPct = totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0;

        // Rank from leaderboard
        const sortedBoard = [...leaderboard].sort((a, b) => b.total - a.total);
        const myIdx = sortedBoard.findIndex(e => e.username === auth.username);
        const rank = myIdx >= 0 ? myIdx + 1 : "—";

        // Total days in campaign
        const totalDays = allDaysData.length;

        // Days where user solved at least one problem
        const solvedDayIds = new Set(submissions.map(s => s.day?.id).filter(Boolean));
        const daysParticipated = solvedDayIds.size;

        setStats({
          totalPoints,
          solvedCount,
          totalProblems,
          totalDays,
          daysParticipated,
          rank,
          completionPct,
        });
      } catch {}
      finally { setLoading(false); }
    })();
  }, [auth.token]);

  if (loading) return <div className="loading">CONSULTING THE DUNGEON MASTER</div>;

  if (!stats) return (
    <div className="panel-document" style={{ textAlign:"center", padding:"var(--sp-xl)" }}>
      <div style={{ fontFamily:"var(--font-mono)", color:"var(--text-muted)", fontSize:"var(--fs-sm)" }}>
        Character sheet unavailable. The Upside Down interferes.
      </div>
    </div>
  );

  const { totalPoints, solvedCount, totalProblems, totalDays, daysParticipated, rank, completionPct } = stats;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"var(--sp-md)" }}>
      {/* Stats grid */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit, minmax(140px,1fr))",
        gap:"var(--sp-sm)",
      }}>
        {[
          { label:"EXPERIENCE POINTS",     value:`${totalPoints}`,                    sub:"total XP earned",                      color:"var(--bright)", glow:"rgba(239,83,80,0.55)" },
          { label:"GATES CLOSED",          value:`${solvedCount}/${totalProblems}`,    sub:"encounters completed",                 color:"var(--success)", glow:"rgba(0,230,118,0.4)" },
          { label:"CHAPTERS PLAYED",       value:`${daysParticipated}/${totalDays}`,   sub:"campaign chapters",                    color:"#ffab40",       glow:"rgba(255,171,64,0.4)" },
          { label:"PARTY RANK",            value:`#${rank}`,                           sub:"campaign standing",                    color:"#82b1ff",       glow:"rgba(130,177,255,0.4)" },
        ].map((s,i) => (
          <div key={i} className="panel" style={{ textAlign:"center", padding:"var(--sp-md)" }}>
            <div style={{
              fontFamily:"var(--font-title)",
              fontSize:"var(--fs-2xl)",
              color:s.color,
              textShadow:`0 0 22px ${s.glow}`,
              lineHeight:1,
            }}>{s.value}</div>
            <div style={{
              fontFamily:"var(--font-mono)",
              fontSize:"0.62rem",
              color:"var(--text-muted)",
              letterSpacing:"0.14em",
              marginTop:"0.5rem",
            }}>{s.label}</div>
            <div style={{
              fontFamily:"var(--font-mono)",
              fontSize:"0.58rem",
              color:"var(--text-muted)",
              marginTop:"0.2rem",
              opacity:0.6,
            }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Campaign progress meter */}
      <div className="panel-document" style={{ padding:"var(--sp-md)" }}>
        <div style={{
          fontFamily:"var(--font-mono)",
          fontSize:"var(--fs-xs)",
          color:"var(--text-muted)",
          letterSpacing:"0.14em",
          marginBottom:"0.8rem",
        }}>
          CAMPAIGN PROGRESS — JOURNEY TO THE UPSIDE DOWN
        </div>
        <div style={{ position:"relative", height:10, background:"rgba(255,255,255,0.04)", borderRadius:5, overflow:"hidden" }}>
          <div className="progress-bar-fill" style={{
            position:"absolute", top:0, left:0, height:"100%",
            width:`${Math.max(completionPct > 0 ? 2 : 0, completionPct)}%`,
          }}/>
        </div>
        <div style={{
          display:"flex", justifyContent:"space-between",
          fontFamily:"var(--font-mono)", fontSize:"0.62rem",
          color:"var(--text-muted)", marginTop:"0.45rem",
        }}>
          <span>HAWKINS</span>
          <span style={{ color:"var(--bright)" }}>{completionPct}% COMPLETE — {solvedCount}/{totalProblems} GATES</span>
          <span>THE UPSIDE DOWN</span>
        </div>
      </div>
    </div>
  );
}

export default function ParticipantDashboard({ auth }) {
  const [view, setView] = useState("latest");
  const active = TABS.find(t => t.key === view);

  return (
    <div>
      {/* Campaign Board header */}
      <div style={{ marginBottom:"2rem" }}>
        <div className="location-tag">THE CAMPAIGN BOARD · HAWKINS CHAPTER</div>
        <h1 className="neon-red" style={{
          fontFamily:"var(--font-title)",
          fontSize:"var(--fs-2xl)",
          letterSpacing:"0.08em",
          lineHeight:1.05,
        }}>
          WELCOME BACK,
        </h1>
        <h2 style={{
          fontFamily:"var(--font-title)",
          fontSize:"var(--fs-xl)",
          color:"var(--text-primary)",
          letterSpacing:"0.12em",
          marginTop:"0.4rem",
        }}>
          {auth.username.toUpperCase()}
        </h2>
        <div className="depth-indicator" style={{ marginTop:"0.6rem" }}>
          PARTY MEMBER · ACTIVE CAMPAIGN · THE UPSIDE DOWN
        </div>
      </div>

      {/* Tab navigation */}
      <div style={{
        display:"flex",
        gap:0,
        marginBottom:"1.6rem",
        borderBottom:"1px solid var(--border)",
        overflowX:"auto",
        overflowY:"hidden",
        scrollbarWidth:"none",
        WebkitOverflowScrolling:"touch",
        position:"relative",
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            style={{
              background:"transparent",
              border:"none",
              borderBottom: view===tab.key
                ? "2px solid var(--bright)"
                : "2px solid transparent",
              fontFamily:"var(--font-title)",
              fontSize:"var(--fs-xs)",
              letterSpacing:"0.1em",
              color: view===tab.key ? "var(--bright)" : "var(--text-muted)",
              textShadow: view===tab.key ? "0 0 4px #ef5350, 0 0 12px #b71c1c" : "none",
              cursor:"pointer",
              padding:"0.65rem 1.1rem",
              marginBottom:"-1px",
              transition:"all 0.3s ease",
              whiteSpace:"nowrap",
              flexShrink:0,
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Active section context */}
      {active && (
        <div style={{
          fontFamily:"var(--font-mono)",
          fontSize:"0.62rem",
          color:"var(--text-muted)",
          letterSpacing:"0.2em",
          marginBottom:"1rem",
        }}>
          ◆ {active.desc.toUpperCase()} — {active.label}
        </div>
      )}

      {view === "latest"   && <LatestDay   auth={auth} />}
      {view === "previous" && <PreviousDays auth={auth} />}
      {view === "progress" && <ProgressView auth={auth} />}
      {view === "settings" && <SettingsView auth={auth} />}
    </div>
  );
}

/* ── Settings / Change Password view ───────────────────────────────────── */
function SettingsView({ auth }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const submit = async () => {
    setMsg(null);
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setMsg({ type: "error", text: "All fields are required." });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (form.newPassword.length < 3) {
      setMsg({ type: "error", text: "New password must be at least 3 characters." });
      return;
    }
    if (form.currentPassword === form.newPassword) {
      setMsg({ type: "error", text: "New password must be different from current password." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/me/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: "Password changed successfully. Your defenses have been upgraded." });
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setMsg({ type: "error", text: data.error || "Failed to change password." });
      }
    } catch {
      setMsg({ type: "error", text: "The Upside Down interfered — request failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480 }}>
      <div className="location-tag" style={{ marginBottom: "1rem" }}>
        HAWKINS LAB · SECURITY CLEARANCE
      </div>
      <h3
        style={{
          fontFamily: "var(--font-title)",
          color: "var(--text-muted)",
          letterSpacing: "0.1em",
          marginBottom: "0.6rem",
          fontSize: "var(--fs-md)",
        }}
      >
        CHANGE PASSWORD
      </h3>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          marginBottom: "1.5rem",
          lineHeight: 1.7,
          letterSpacing: "0.04em",
        }}
      >
        Upgrade your security clearance. Enter your current password to verify identity.
      </div>

      {msg && (
        <div
          className={msg.type === "error" ? "msg-error" : "msg-success"}
          style={{ marginBottom: "1.5rem" }}
        >
          {msg.text}
        </div>
      )}

      <div className="panel-glow" style={{ marginBottom: "1.5rem" }}>
        <div className="form-group">
          <label>Current Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showCurrent ? "text" : "password"}
              value={form.currentPassword}
              onChange={(e) => handleChange("currentPassword", e.target.value)}
              placeholder="Enter current password"
              style={{ width: "100%", paddingRight: "3rem" }}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontFamily: "var(--font-mono)",
              }}
            >
              {showCurrent ? "HIDE" : "SHOW"}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>New Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showNew ? "text" : "password"}
              value={form.newPassword}
              onChange={(e) => handleChange("newPassword", e.target.value)}
              placeholder="Enter new password"
              style={{ width: "100%", paddingRight: "3rem" }}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontFamily: "var(--font-mono)",
              }}
            >
              {showNew ? "HIDE" : "SHOW"}
            </button>
          </div>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label>Confirm New Password</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            placeholder="Confirm new password"
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={submit}
        disabled={loading}
        style={{ padding: "0.8rem 2rem", fontSize: "0.85rem" }}
      >
        {loading ? "CHANGING..." : "🔒 UPDATE PASSWORD"}
      </button>
    </div>
  );
}