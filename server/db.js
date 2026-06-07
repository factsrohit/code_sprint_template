const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "database.sqlite");
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ─── Schema Init ────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    poster_path TEXT,
    reading_material TEXT,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_open INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    external_link TEXT,
    description TEXT,
    FOREIGN KEY (day_id) REFERENCES days(id)
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    problem_id INTEGER NOT NULL,
    done_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, problem_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (problem_id) REFERENCES problems(id)
  );

  CREATE TABLE IF NOT EXISTS point_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    tier1_hrs REAL NOT NULL DEFAULT 24,
    tier2_hrs REAL NOT NULL DEFAULT 48,
    tier3_hrs REAL NOT NULL DEFAULT 168,
    tier1_pts INTEGER NOT NULL DEFAULT 3,
    tier2_pts INTEGER NOT NULL DEFAULT 2,
    tier3_pts INTEGER NOT NULL DEFAULT 1
  );

  INSERT OR IGNORE INTO point_config (id) VALUES (1);
`);

// ─── Helpers ────────────────────────────────────────────────────────────────

function calcPoints(doneAt, dayStartedAt, config) {
  const done = new Date(doneAt).getTime();
  const start = new Date(dayStartedAt).getTime();
  const diffHrs = (done - start) / (1000 * 60 * 60);
  if (diffHrs <= config.tier1_hrs) return config.tier1_pts;
  if (diffHrs <= config.tier2_hrs) return config.tier2_pts;
  if (diffHrs <= config.tier3_hrs) return config.tier3_pts;
  return 0;
}

// ─── Users ──────────────────────────────────────────────────────────────────

function createUser(username, hashedPassword) {
  return db
    .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
    .run(username, hashedPassword);
}

function getUserByUsername(username) {
  return db.prepare("SELECT * FROM users WHERE username = ?").get(username);
}

function getUserById(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

function getAllUsers() {
  return db.prepare("SELECT id, username, created_at FROM users").all();
}

// ─── Days ───────────────────────────────────────────────────────────────────

function createDay(dayNumber, title, posterPath, readingMaterial) {
  return db
    .prepare(
      "INSERT INTO days (day_number, title, poster_path, reading_material) VALUES (?, ?, ?, ?)"
    )
    .run(dayNumber, title, posterPath || null, readingMaterial || null);
}

function getAllDays() {
  return db.prepare("SELECT * FROM days ORDER BY day_number ASC").all();
}

function getLatestDay() {
  return db.prepare("SELECT * FROM days ORDER BY day_number DESC LIMIT 1").get();
}

function getDayById(id) {
  return db.prepare("SELECT * FROM days WHERE id = ?").get(id);
}

function updateDayOpenStatus(dayId, isOpen) {
  return db
    .prepare("UPDATE days SET is_open = ? WHERE id = ?")
    .run(isOpen ? 1 : 0, dayId);
}

function deleteDay(dayId) {
  const problems = getProblemsByDayId(dayId);
  const deleteSubmission = db.prepare("DELETE FROM submissions WHERE problem_id = ?");
  const deleteProblems = db.prepare("DELETE FROM problems WHERE day_id = ?");
  const deleteDayStmt = db.prepare("DELETE FROM days WHERE id = ?");

  const deleteTx = db.transaction(() => {
    problems.forEach((problem) => deleteSubmission.run(problem.id));
    deleteProblems.run(dayId);
    deleteDayStmt.run(dayId);
  });

  deleteTx();
}

// ─── Problems ───────────────────────────────────────────────────────────────

function createProblem(dayId, name, externalLink, description) {
  return db
    .prepare(
      "INSERT INTO problems (day_id, name, external_link, description) VALUES (?, ?, ?, ?)"
    )
    .run(dayId, name, externalLink || null, description || null);
}

function getProblemsByDayId(dayId) {
  return db.prepare("SELECT * FROM problems WHERE day_id = ?").all(dayId);
}

function getAllProblems() {
  return db.prepare("SELECT * FROM problems ORDER BY day_id ASC, id ASC").all();
}

function getProblemById(id) {
  return db.prepare("SELECT * FROM problems WHERE id = ?").get(id);
}

// ─── Submissions ─────────────────────────────────────────────────────────────

function createSubmission(userId, problemId) {
  return db
    .prepare(
      "INSERT OR IGNORE INTO submissions (user_id, problem_id) VALUES (?, ?)"
    )
    .run(userId, problemId);
}

function getSubmissionsByUser(userId) {
  return db
    .prepare("SELECT * FROM submissions WHERE user_id = ?")
    .all(userId);
}

function getAllSubmissions() {
  return db.prepare("SELECT * FROM submissions").all();
}

function deleteSubmission(userId, problemId) {
  return db
    .prepare("DELETE FROM submissions WHERE user_id = ? AND problem_id = ?")
    .run(userId, problemId);
}

// ─── Point Config ─────────────────────────────────────────────────────────────

function getPointConfig() {
  return db.prepare("SELECT * FROM point_config WHERE id = 1").get();
}

function updatePointConfig(tier1Hrs, tier2Hrs, tier3Hrs, tier1Pts, tier2Pts, tier3Pts) {
  return db
    .prepare(
      "UPDATE point_config SET tier1_hrs=?, tier2_hrs=?, tier3_hrs=?, tier1_pts=?, tier2_pts=?, tier3_pts=? WHERE id=1"
    )
    .run(tier1Hrs, tier2Hrs, tier3Hrs, tier1Pts, tier2Pts, tier3Pts);
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

function getLeaderboard() {
  const config = getPointConfig();
  const users = getAllUsers();
  const submissions = getAllSubmissions();
  const problems = getAllProblems();
  const days = getAllDays();

  const dayMap = {};
  days.forEach((d) => (dayMap[d.id] = d));
  const problemMap = {};
  problems.forEach((p) => (problemMap[p.id] = p));

  const userScores = users.map((u) => {
    const userSubs = submissions.filter((s) => s.user_id === u.id);
    let total = 0;
    userSubs.forEach((s) => {
      const problem = problemMap[s.problem_id];
      if (!problem) return;
      const day = dayMap[problem.day_id];
      if (!day) return;
      total += calcPoints(s.done_at, day.started_at, config);
    });
    return { id: u.id, username: u.username, total };
  });

  return userScores.sort((a, b) => b.total - a.total);
}

// Full standings for admin (per problem breakdown)
function getFullStandings() {
  const config = getPointConfig();
  const users = getAllUsers();
  const submissions = getAllSubmissions();
  const problems = getAllProblems();
  const days = getAllDays();

  const dayMap = {};
  days.forEach((d) => (dayMap[d.id] = d));
  const problemMap = {};
  problems.forEach((p) => (problemMap[p.id] = p));

  const subIndex = {};
  submissions.forEach((s) => {
    const key = `${s.user_id}_${s.problem_id}`;
    subIndex[key] = s;
  });

  return users.map((u) => {
    let total = 0;
    const problemPoints = {};
    problems.forEach((p) => {
      const key = `${u.id}_${p.id}`;
      const sub = subIndex[key];
      if (sub) {
        const day = dayMap[p.day_id];
        const pts = calcPoints(sub.done_at, day.started_at, config);
        problemPoints[p.id] = pts;
        total += pts;
      } else {
        problemPoints[p.id] = null;
      }
    });
    return { id: u.id, username: u.username, total, problemPoints };
  });
}

// ─── Export / Import ──────────────────────────────────────────────────────────

function exportAllData() {
  return {
    exported_at: new Date().toISOString(),
    users: db.prepare("SELECT * FROM users").all(),
    days: db.prepare("SELECT * FROM days").all(),
    problems: db.prepare("SELECT * FROM problems").all(),
    submissions: db.prepare("SELECT * FROM submissions").all(),
    point_config: getPointConfig(),
  };
}

function importAllData(data) {
  const importTx = db.transaction(() => {
    db.exec(`
      DELETE FROM submissions;
      DELETE FROM problems;
      DELETE FROM days;
      DELETE FROM users;
      DELETE FROM point_config;
    `);

    const insertUser = db.prepare(
      "INSERT INTO users (id, username, password, created_at) VALUES (?, ?, ?, ?)"
    );
    (data.users || []).forEach((u) =>
      insertUser.run(u.id, u.username, u.password, u.created_at)
    );

    const insertDay = db.prepare(
      "INSERT INTO days (id, day_number, title, poster_path, reading_material, started_at, is_open) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    (data.days || []).forEach((d) =>
      insertDay.run(d.id, d.day_number, d.title, d.poster_path, d.reading_material, d.started_at, d.is_open)
    );

    const insertProblem = db.prepare(
      "INSERT INTO problems (id, day_id, name, external_link, description) VALUES (?, ?, ?, ?, ?)"
    );
    (data.problems || []).forEach((p) =>
      insertProblem.run(p.id, p.day_id, p.name, p.external_link, p.description)
    );

    const insertSub = db.prepare(
      "INSERT INTO submissions (id, user_id, problem_id, done_at) VALUES (?, ?, ?, ?)"
    );
    (data.submissions || []).forEach((s) =>
      insertSub.run(s.id, s.user_id, s.problem_id, s.done_at)
    );

    const pc = data.point_config || {};
    db.prepare(
      "INSERT INTO point_config (id, tier1_hrs, tier2_hrs, tier3_hrs, tier1_pts, tier2_pts, tier3_pts) VALUES (1, ?, ?, ?, ?, ?, ?)"
    ).run(
      pc.tier1_hrs || 24,
      pc.tier2_hrs || 48,
      pc.tier3_hrs || 168,
      pc.tier1_pts || 3,
      pc.tier2_pts || 2,
      pc.tier3_pts || 1
    );
  });
  importTx();
}

module.exports = {
  createUser,
  getUserByUsername,
  getUserById,
  getAllUsers,
  createDay,
  getAllDays,
  getLatestDay,
  getDayById,
  updateDayOpenStatus,
  deleteDay,
  createProblem,
  getProblemsByDayId,
  getAllProblems,
  getProblemById,
  createSubmission,
  getSubmissionsByUser,
  getAllSubmissions,
  deleteSubmission,
  getPointConfig,
  updatePointConfig,
  getLeaderboard,
  getFullStandings,
  exportAllData,
  importAllData,
  calcPoints,
};