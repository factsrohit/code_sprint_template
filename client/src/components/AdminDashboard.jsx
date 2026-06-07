import React, { useState, useEffect } from "react";
import AdminStandings from "./AdminStandings";

export default function AdminDashboard({ auth }) {
  const [tab, setTab] = useState("standings");

  const tabs = [
    { key: "standings", label: "📊 THE BOARD" },
    { key: "new-day", label: "➕ NEW CHAPTER" },
    { key: "days", label: "📕 MANAGE CHAPTERS" },
    { key: "config", label: "⚙ XP CALIBRATION" },
    { key: "backup", label: "💾 LAB ARCHIVE" },
  ];

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div className="location-tag">HAWKINS NATIONAL LABORATORY · CONTROL CENTER</div>
        <h1 className="neon-red" style={{
          fontFamily: "var(--font-title)",
          fontSize: "var(--fs-2xl)",
          letterSpacing: "0.08em",
          lineHeight: 1.1,
        }}>
          HAWKINS LAB CONTROL
        </h1>
        <div className="depth-indicator" style={{ marginTop:"0.5rem" }}>
          DR. BRENNER'S OFFICE · CLASSIFIED ACCESS ONLY
        </div>
      </div>

      {/* Tab nav */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          marginBottom: "1.8rem",
          overflowX: "auto",
          overflowY: "hidden",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom:
                tab === t.key ? "2px solid var(--bright)" : "2px solid transparent",
              color: tab === t.key ? "var(--bright)" : "var(--text-muted)",
              textShadow: tab === t.key ? "0 0 4px #ef5350, 0 0 12px #b71c1c" : "none",
              fontFamily: "var(--font-title)",
              fontSize: "var(--fs-xs)",
              letterSpacing: "0.1em",
              padding: "0.65rem 1rem",
              cursor: "pointer",
              marginBottom: "-1px",
              transition: "all 0.3s ease",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "standings" && <AdminStandings auth={auth} />}
      {tab === "new-day" && <NewDayForm auth={auth} />}
      {tab === "days" && <ManageDays auth={auth} />}
      {tab === "config" && <PointConfig auth={auth} />}
      {tab === "backup" && <BackupPanel auth={auth} />}
    </div>
  );
}

// ── New Chapter Form ─────────────────────────────────────────────────────────
function NewDayForm({ auth }) {
  const [form, setForm] = useState({
    day_number: "",
    title: "",
    reading_material: "",
  });
  const [problems, setProblems] = useState([
    { name: "", external_link: "", description: "" },
  ]);
  const [poster, setPoster] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const addProblem = () => {
    if (problems.length < 6) {
      setProblems((p) => [...p, { name: "", external_link: "", description: "" }]);
    }
  };

  const removeProblem = (i) => {
    if (problems.length > 1) setProblems((p) => p.filter((_, idx) => idx !== i));
  };

  const updateProblem = (i, field, val) => {
    setProblems((p) =>
      p.map((prob, idx) => (idx === i ? { ...prob, [field]: val } : prob))
    );
  };

  const submit = async () => {
    if (!form.day_number || !form.title) {
      setMsg({ type: "error", text: "Chapter number and campaign title required" });
      return;
    }
    if (problems.some((p) => !p.name.trim())) {
      setMsg({ type: "error", text: "All encounters must have a designation" });
      return;
    }

    setLoading(true);
    setMsg(null);

    const fd = new FormData();
    fd.append("day_number", form.day_number);
    fd.append("title", form.title);
    fd.append("reading_material", form.reading_material);
    fd.append(
      "problems",
      JSON.stringify(
        problems.map((p) => ({
          name: p.name.trim(),
          external_link: p.external_link.trim() || null,
          description: p.description.trim() || null,
        }))
      )
    );
    if (poster) fd.append("poster", poster);

    try {
      const res = await fetch("/api/admin/days", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "error", text: data.error });
        return;
      }
      setMsg({
        type: "success",
        text: `Chapter ${data.day.day_number} opened with ${data.problems.length} encounters! The Gate widens.`,
      });
      setForm({ day_number: "", title: "", reading_material: "" });
      setProblems([{ name: "", external_link: "", description: "" }]);
      setPoster(null);
    } catch {
      setMsg({ type: "error", text: "The Upside Down interfered — request rejected" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="location-tag" style={{ marginBottom:"1rem" }}>HAWKINS LAB · NEW CHAPTER</div>
      <h3 style={{
        fontFamily: "var(--font-title)",
        color: "var(--text-muted)",
        letterSpacing: "0.1em",
        marginBottom: "1.2rem",
        fontSize: "var(--fs-md)",
      }}>
        OPEN NEW CAMPAIGN CHAPTER
      </h3>

      {msg && (
        <div className={msg.type === "error" ? "msg-error" : "msg-success"}>
          {msg.text}
        </div>
      )}

      <div className="panel-glow" style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "clamp(100px, 18vw, 140px) 1fr",
            gap: "var(--sp-md)",
            marginBottom: "1.2rem",
          }}
        >
          <div className="form-group" style={{ margin: 0 }}>
            <label>Chapter Number</label>
            <input
              type="number"
              min="1"
              value={form.day_number}
              onChange={(e) =>
                setForm((f) => ({ ...f, day_number: e.target.value }))
              }
              placeholder="1"
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Campaign Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="The Vanishing of Will Byers"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Evidence Photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPoster(e.target.files[0] || null)}
            style={{ padding: "0.5rem" }}
          />
          {poster && (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.72rem",
                color: "var(--success)",
                marginTop: "0.4rem",
              }}
            >
              ✓ {poster.name}
            </div>
          )}
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label>Dungeon Master's Briefing (optional)</label>
          <textarea
            rows={5}
            value={form.reading_material}
            onChange={(e) =>
              setForm((f) => ({ ...f, reading_material: e.target.value }))
            }
            placeholder="Enter the campaign briefing..."
          />
        </div>
      </div>

      {/* Encounters */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div className="flex-between" style={{ marginBottom: "1rem" }}>
          <div
            style={{
              fontFamily: "var(--font-title)",
              fontSize: "0.9rem",
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
            }}
          >
            🌀 ENCOUNTERS ({problems.length}/6)
          </div>
          <button
            className="btn btn-ghost"
            style={{ fontSize: "0.7rem", padding: "0.3rem 0.7rem" }}
            onClick={addProblem}
          >
            + ADD ENCOUNTER
          </button>
        </div>

        {problems.map((prob, i) => (
          <div
            key={i}
            className="panel"
            style={{ marginBottom: "1rem", position: "relative" }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                color: "var(--text-muted)",
                marginBottom: "0.8rem",
                letterSpacing: "0.1em",
              }}
            >
              ENCOUNTER {String(i + 1).padStart(2, "0")}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "1rem",
                marginBottom: "0.8rem",
              }}
            >
              <div className="form-group" style={{ margin: 0 }}>
                <label>Encounter Name *</label>
                <input
                  type="text"
                  value={prob.name}
                  onChange={(e) => updateProblem(i, "name", e.target.value)}
                  placeholder="The Demogorgon's Lair"
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Gate Link (optional)</label>
                <input
                  type="url"
                  value={prob.external_link}
                  onChange={(e) =>
                    updateProblem(i, "external_link", e.target.value)
                  }
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Intel Hints (optional)</label>
              <textarea
                rows={2}
                value={prob.description}
                onChange={(e) => updateProblem(i, "description", e.target.value)}
                placeholder="Classified intel for this encounter..."
              />
            </div>

            {problems.length > 1 && (
              <button
                onClick={() => removeProblem(i)}
                style={{
                  position: "absolute",
                  top: "0.8rem",
                  right: "0.8rem",
                  background: "transparent",
                  border: "none",
                  color: "var(--bright)",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontFamily: "var(--font-mono)",
                  textShadow: "0 0 8px rgba(183,28,28,0.35)",
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary"
        onClick={submit}
        disabled={loading}
        style={{ padding: "0.8rem 2.5rem", fontSize: "0.85rem" }}
      >
        {loading ? "OPENING THE GATE..." : "⚡ OPEN CHAPTER"}
      </button>
    </div>
  );
}

// ── Manage Chapters ──────────────────────────────────────────────────────────
function ManageDays({ auth }) {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState({});
  const [deleting, setDeleting] = useState({});
  const [confirmDeleteDay, setConfirmDeleteDay] = useState(null);
  const [msg, setMsg] = useState(null);

  const fetchDays = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/days", {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setDays(await res.json());
    } catch {
      setMsg({ type: "error", text: "The Mind Flayer interfered — failed to retrieve chapters." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDays();
  }, []);

  const toggleDay = async (dayId, currentOpen) => {
    setToggling((t) => ({ ...t, [dayId]: true }));
    try {
      const res = await fetch(`/api/admin/days/${dayId}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (res.ok) {
        setDays((ds) =>
          ds.map((d) =>
            d.day.id === dayId
              ? { ...d, day: { ...d.day, is_open: !currentOpen } }
              : d
          )
        );
      }
    } catch {
      setMsg({ type: "error", text: "The Upside Down interfered — operation failed." });
    } finally {
      setToggling((t) => ({ ...t, [dayId]: false }));
    }
  };

  const deleteDay = async (dayId) => {
    setDeleting((t) => ({ ...t, [dayId]: true }));
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/days/${dayId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (res.ok) {
        setDays((ds) => ds.filter((d) => d.day.id !== dayId));
        setConfirmDeleteDay(null);
        setMsg({ type: "success", text: "Chapter erased from the timeline." });
      } else {
        const body = await res.json();
        setMsg({ type: "error", text: body.error || "Erasure failed." });
      }
    } catch {
      setMsg({ type: "error", text: "The Mind Flayer blocked the request." });
    } finally {
      setDeleting((t) => ({ ...t, [dayId]: false }));
    }
  };

  if (loading) return <div className="loading">SCANNING CHAPTER ARCHIVE</div>;

  return (
    <div>
      <div className="location-tag" style={{ marginBottom:"1rem" }}>HAWKINS LAB · CHAPTER MANAGEMENT ({days.length})</div>
      <h3 style={{
        fontFamily: "var(--font-title)",
        color: "var(--text-muted)",
        letterSpacing: "0.1em",
        marginBottom: "1.2rem",
        fontSize: "var(--fs-md)",
      }}>
        MANAGE CAMPAIGN CHAPTERS
      </h3>

      {msg && (
        <div
          className={msg.type === "error" ? "msg-error" : "msg-success"}
          style={{ marginBottom: "1.5rem" }}
        >
          {msg.text}
        </div>
      )}

      {days.length === 0 && (
        <div
          className="panel"
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.1em",
          }}
        >
          No chapters exist yet. The campaign hasn't begun.
        </div>
      )}

      {[...days].reverse().map(({ day, problems }) => (
        <div key={day.id} className="panel" style={{ marginBottom: "1rem" }}>
          <div className="flex-between" style={{ marginBottom: "0.8rem" }}>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  letterSpacing: "0.1em",
                }}
              >
                CHAPTER {day.day_number}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-title)",
                  fontSize: "1.2rem",
                  color: "var(--text-primary)",
                  letterSpacing: "0.08em",
                  marginTop: "0.2rem",
                }}
              >
                {day.title}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.68rem",
                  color: "var(--text-muted)",
                  marginTop: "0.3rem",
                }}
              >
                {new Date(day.started_at).toLocaleString()} · {problems.length} encounters
              </div>
            </div>
            <div className="flex gap-sm" style={{ alignItems: "center" }}>
              <span
                className={`badge ${
                  day.is_open ? "badge-open" : "badge-closed"
                }`}
              >
                {day.is_open ? "GATE OPEN" : "SEALED"}
              </span>
              <button
                className={`btn ${day.is_open ? "btn-danger" : "btn-success"}`}
                style={{ fontSize: "0.75rem" }}
                disabled={toggling[day.id]}
                onClick={() => toggleDay(day.id, day.is_open)}
              >
                {toggling[day.id] ? "..." : day.is_open ? "SEAL GATE" : "OPEN GATE"}
              </button>
              {confirmDeleteDay === day.id ? (
                <div className="flex gap-sm" style={{ alignItems: "center" }}>
                  <button
                    className="btn btn-danger"
                    style={{ fontSize: "0.75rem" }}
                    disabled={deleting[day.id]}
                    onClick={() => deleteDay(day.id)}
                  >
                    {deleting[day.id] ? "ERASING..." : "CONFIRM ERASE"}
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: "0.75rem" }}
                    onClick={() => setConfirmDeleteDay(null)}
                  >
                    STAND DOWN
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-danger"
                  style={{ fontSize: "0.75rem" }}
                  onClick={() => setConfirmDeleteDay(day.id)}
                >
                  ERASE CHAPTER
                </button>
              )}
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {problems.map((p) => (
              <span
                key={p.id}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  padding: "0.2rem 0.6rem",
                  borderRadius: 2,
                  color: "var(--text-muted)",
                }}
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── XP Config ────────────────────────────────────────────────────────────────
function PointConfig({ auth }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/point-config", {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        setConfig(await res.json());
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/point-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(config),
      });
      if (res.ok) setMsg({ type: "success", text: "XP protocol updated. The Party is notified." });
      else setMsg({ type: "error", text: "Calibration error — update failed." });
    } catch {
      setMsg({ type: "error", text: "The Mind Flayer blocked the update." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">ACCESSING XP CALIBRATION DATA</div>;

  return (
    <div style={{ maxWidth: 550 }}>
      <div className="location-tag" style={{ marginBottom:"1rem" }}>HAWKINS LAB · XP CALIBRATION</div>
      <h3 style={{
        fontFamily: "var(--font-title)",
        color: "var(--text-muted)",
        letterSpacing: "0.1em",
        marginBottom: "1.2rem",
        fontSize: "var(--fs-md)",
      }}>
        XP ALLOCATION PROTOCOL
      </h3>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.8rem",
          color: "var(--text-muted)",
          marginBottom: "1.5rem",
          lineHeight: 1.8,
        }}
      >
        Party members earn XP based on how fast they close a gate. Speed matters in the Upside Down.
      </div>

      {msg && (
        <div
          className={msg.type === "error" ? "msg-error" : "msg-success"}
          style={{ marginBottom: "1.5rem" }}
        >
          {msg.text}
        </div>
      )}

      {[
        { tier: 1, label: "TIER 1 — Lightning Reflexes" },
        { tier: 2, label: "TIER 2 — Standard Response" },
        { tier: 3, label: "TIER 3 — Late Arrival" },
      ].map(({ tier, label }) => (
        <div key={tier} className="panel" style={{ marginBottom: "1rem" }}>
          <div
            style={{
              fontFamily: "var(--font-title)",
              fontSize: "var(--fs-sm)",
              color: "var(--bright)",
              letterSpacing: "0.1em",
              marginBottom: "0.8rem",
              textShadow: "0 0 14px rgba(183,28,28,0.4)",
            }}
          >
            {label}
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}
          >
            <div className="form-group" style={{ margin: 0 }}>
              <label>Response Window (hours)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={config[`tier${tier}_hrs`]}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    [`tier${tier}_hrs`]: parseFloat(e.target.value),
                  }))
                }
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>XP Awarded</label>
              <input
                type="number"
                min="0"
                value={config[`tier${tier}_pts`]}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    [`tier${tier}_pts`]: parseInt(e.target.value),
                  }))
                }
              />
            </div>
          </div>
        </div>
      ))}

      <div
        className="panel"
        style={{
          marginBottom: "1.5rem",
          background: "var(--surface)",
          border: "1px dashed var(--border-glow)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            lineHeight: 1.8,
            letterSpacing: "0.05em",
          }}
        >
          <span style={{ color: "var(--bright)" }}>Current Protocol:</span>
          <br />≤ {config?.tier1_hrs}h → {config?.tier1_pts} XP
          <br />≤ {config?.tier2_hrs}h → {config?.tier2_pts} XP
          <br />≤ {config?.tier3_hrs}h → {config?.tier3_pts} XP
          <br />
          Beyond {config?.tier3_hrs}h → The Demogorgon gets you (0 XP)
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={save}
        disabled={saving}
        style={{ padding: "0.8rem 2rem", fontSize: "0.85rem" }}
      >
        {saving ? "SAVING..." : "SAVE PROTOCOL"}
      </button>
    </div>
  );
}

// ── Lab Archive (Backup) ─────────────────────────────────────────────────────
function BackupPanel({ auth }) {
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState(null);

  const exportData = async () => {
    try {
      const res = await fetch("/api/admin/export", {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disp = res.headers.get("Content-Disposition") || "";
      const match = disp.match(/filename="(.+)"/);
      a.download = match ? match[1] : "hawkins-lab-archive.json";
      a.click();
      URL.revokeObjectURL(url);
      setMsg({ type: "success", text: "Lab archives have been preserved." });
    } catch {
      setMsg({ type: "error", text: "Archive extraction failed. The Mind Flayer interfered." });
    }
  };

  const importData = async () => {
    if (!importFile) return;
    setImporting(true);
    setMsg(null);
    const fd = new FormData();
    fd.append("backup", importFile);
    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: fd,
      });
      const json = await res.json();
      if (res.ok) {
        setMsg({
          type: "success",
          text: "Timeline restored. All campaign data has been overwritten.",
        });
        setImportFile(null);
        setConfirm(false);
      } else {
        setMsg({ type: "error", text: json.error });
      }
    } catch {
      setMsg({ type: "error", text: "Timeline restoration failed." });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="location-tag" style={{ marginBottom:"1rem" }}>HAWKINS LAB · DATA ARCHIVE</div>
      <h3 style={{
        fontFamily: "var(--font-title)",
        color: "var(--text-muted)",
        letterSpacing: "0.1em",
        marginBottom: "1.2rem",
        fontSize: "var(--fs-md)",
      }}>
        HAWKINS LAB ARCHIVE
      </h3>

      {msg && (
        <div
          className={msg.type === "error" ? "msg-error" : "msg-success"}
          style={{ marginBottom: "1.5rem" }}
        >
          {msg.text}
        </div>
      )}

      {/* Export */}
      <div className="panel-glow" style={{ marginBottom: "2rem" }}>
        <div
          style={{
            fontFamily: "var(--font-title)",
            fontSize: "0.95rem",
            color: "var(--bright)",
            letterSpacing: "0.1em",
            marginBottom: "0.6rem",
            textShadow: "0 0 10px rgba(183,28,28,0.3)",
          }}
        >
          💾 EXTRACT ARCHIVE
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.82rem",
            color: "var(--text-muted)",
            marginBottom: "1.2rem",
            lineHeight: 1.7,
          }}
        >
          Exports all subjects, chapters, gate closures, and
          XP allocation data into a secure JSON artifact.
        </div>
        <button
          className="btn btn-primary"
          onClick={exportData}
          style={{ fontSize: "0.85rem", padding: "0.8rem 1.5rem" }}
        >
          EXTRACT ARCHIVE
        </button>
      </div>

      {/* Import */}
      <div
        className="panel"
        style={{ border: "1px solid var(--border-glow)", position: "relative" }}
      >
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "15px",
            fontSize: "1.5rem",
            color: "rgba(183,28,28,0.2)",
            animation: "breathe 4s infinite",
          }}
        >
          ⚠
        </div>
        <div
          style={{
            fontFamily: "var(--font-title)",
            fontSize: "0.95rem",
            color: "var(--bright)",
            letterSpacing: "0.1em",
            marginBottom: "0.6rem",
          }}
        >
          ⚠ RESTORE TIMELINE
        </div>
        <div
          style={{
            background: "rgba(58, 0, 0, 0.2)",
            border: "1px dashed rgba(183,28,28,0.3)",
            padding: "0.8rem 1.2rem",
            borderRadius: 3,
            fontFamily: "var(--font-mono)",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            marginBottom: "1.2rem",
            lineHeight: 1.7,
            boxShadow: "0 0 15px rgba(127,0,0,0.15)",
          }}
        >
          WARNING: Restoring from backup will overwrite ALL current data.
          All existing subjects and chapters will be replaced.
          Extract a current archive first. This is like Eleven resetting the timeline.
        </div>

        <div className="form-group">
          <label>Select Backup File (.json)</label>
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              setImportFile(e.target.files[0] || null);
              setConfirm(false);
              setMsg(null);
            }}
            style={{ padding: "0.5rem" }}
          />
          {importFile && (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--success)",
                marginTop: "0.4rem",
              }}
            >
              ✓ File selected: {importFile.name}
            </div>
          )}
        </div>

        {importFile && !confirm && (
          <button
            className="btn btn-danger"
            onClick={() => setConfirm(true)}
            style={{ marginTop: "0.5rem", fontSize: "0.85rem", padding: "0.8rem 1.5rem" }}
          >
            INITIATE TIMELINE RESTORE
          </button>
        )}

        {confirm && (
          <div
            style={{
              marginTop: "1rem",
              paddingTop: "1rem",
              borderTop: "1px dashed rgba(183,28,28,0.4)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem",
                color: "var(--bright)",
                marginBottom: "1rem",
                fontWeight: "bold",
              }}
            >
              Are you certain? All current data will be permanently overwritten.
            </div>
            <div className="flex gap-md">
              <button
                className="btn btn-danger"
                onClick={importData}
                disabled={importing}
                style={{ fontSize: "0.85rem", padding: "0.8rem 1.5rem" }}
              >
                {importing ? "RESTORING..." : "YES, OVERWRITE & RESTORE"}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setConfirm(false)}
                style={{ fontSize: "0.85rem", padding: "0.8rem 1.5rem" }}
              >
                ABORT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}