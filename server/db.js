const { createClient } = require("@libsql/client");
const config = require("../config");

// ─── Turso Client ───────────────────────────────────────────────────────────
const db = createClient({
  url: config.TURSO_DATABASE_URL,
  authToken: config.TURSO_AUTH_TOKEN,
});

// ─── Schema Init with Auto-Retry ────────────────────────────────────────────

async function initDatabase(retries = 5, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await db.batch(
        [
          `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          )`,
          `CREATE TABLE IF NOT EXISTS days (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            day_number INTEGER NOT NULL,
            title TEXT NOT NULL,
            poster_path TEXT,
            reading_material TEXT,
            started_at TEXT NOT NULL DEFAULT (datetime('now')),
            is_open INTEGER NOT NULL DEFAULT 1
          )`,
          `CREATE TABLE IF NOT EXISTS problems (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            day_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            external_link TEXT,
            description TEXT,
            FOREIGN KEY (day_id) REFERENCES days(id)
          )`,
          `CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            problem_id INTEGER NOT NULL,
            done_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(user_id, problem_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (problem_id) REFERENCES problems(id)
          )`,
          `CREATE TABLE IF NOT EXISTS point_config (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            tier1_hrs REAL NOT NULL DEFAULT 24,
            tier2_hrs REAL NOT NULL DEFAULT 48,
            tier3_hrs REAL NOT NULL DEFAULT 168,
            tier1_pts INTEGER NOT NULL DEFAULT 3,
            tier2_pts INTEGER NOT NULL DEFAULT 2,
            tier3_pts INTEGER NOT NULL DEFAULT 1
          )`,
          `INSERT OR IGNORE INTO point_config (id) VALUES (1)`,
        ],
        "write"
      );
      console.log(`✅ Connected to Turso database (attempt ${attempt})`);
      return;
    } catch (err) {
      console.error(
        `❌ DB connection attempt ${attempt}/${retries} failed:`,
        err.message
      );
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw new Error("Failed to connect to Turso database after all retries");
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function calcPoints(doneAt, dayStartedAt, pointConfig) {
  const done = new Date(doneAt).getTime();
  const start = new Date(dayStartedAt).getTime();
  const diffHrs = (done - start) / (1000 * 60 * 60);
  if (diffHrs <= pointConfig.tier1_hrs) return pointConfig.tier1_pts;
  if (diffHrs <= pointConfig.tier2_hrs) return pointConfig.tier2_pts;
  if (diffHrs <= pointConfig.tier3_hrs) return pointConfig.tier3_pts;
  return 0;
}

// ─── Users ──────────────────────────────────────────────────────────────────

async function createUser(username, hashedPassword) {
  const result = await db.execute({
    sql: "INSERT INTO users (username, password) VALUES (?, ?)",
    args: [username, hashedPassword],
  });
  return { lastInsertRowid: Number(result.lastInsertRowid) };
}

async function getUserByUsername(username) {
  const result = await db.execute({
    sql: "SELECT * FROM users WHERE username = ?",
    args: [username],
  });
  return result.rows[0] || null;
}

async function getUserById(id) {
  const result = await db.execute({
    sql: "SELECT * FROM users WHERE id = ?",
    args: [id],
  });
  return result.rows[0] || null;
}

async function getAllUsers() {
  const result = await db.execute(
    "SELECT id, username, created_at FROM users"
  );
  return result.rows;
}

async function updateUserPassword(userId, hashedPassword) {
  return await db.execute({
    sql: "UPDATE users SET password = ? WHERE id = ?",
    args: [hashedPassword, userId],
  });
}

// ─── Days ───────────────────────────────────────────────────────────────────

async function createDay(dayNumber, title, posterPath, readingMaterial) {
  const result = await db.execute({
    sql: "INSERT INTO days (day_number, title, poster_path, reading_material) VALUES (?, ?, ?, ?)",
    args: [dayNumber, title, posterPath || null, readingMaterial || null],
  });
  return { lastInsertRowid: Number(result.lastInsertRowid) };
}

async function getAllDays() {
  const result = await db.execute(
    "SELECT * FROM days ORDER BY day_number ASC"
  );
  return result.rows;
}

async function getLatestDay() {
  const result = await db.execute(
    "SELECT * FROM days ORDER BY day_number DESC LIMIT 1"
  );
  return result.rows[0] || null;
}

async function getDayById(id) {
  const result = await db.execute({
    sql: "SELECT * FROM days WHERE id = ?",
    args: [id],
  });
  return result.rows[0] || null;
}

async function updateDayOpenStatus(dayId, isOpen) {
  return await db.execute({
    sql: "UPDATE days SET is_open = ? WHERE id = ?",
    args: [isOpen ? 1 : 0, dayId],
  });
}

async function deleteDay(dayId) {
  const problems = await getProblemsByDayId(dayId);
  const stmts = [];

  // Delete submissions for each problem in this day
  problems.forEach((problem) => {
    stmts.push({
      sql: "DELETE FROM submissions WHERE problem_id = ?",
      args: [problem.id],
    });
  });

  // Delete problems and the day itself
  stmts.push({
    sql: "DELETE FROM problems WHERE day_id = ?",
    args: [dayId],
  });
  stmts.push({
    sql: "DELETE FROM days WHERE id = ?",
    args: [dayId],
  });

  await db.batch(stmts, "write");
}

// ─── Problems ───────────────────────────────────────────────────────────────

async function createProblem(dayId, name, externalLink, description) {
  const result = await db.execute({
    sql: "INSERT INTO problems (day_id, name, external_link, description) VALUES (?, ?, ?, ?)",
    args: [dayId, name, externalLink || null, description || null],
  });
  return { lastInsertRowid: Number(result.lastInsertRowid) };
}

async function getProblemsByDayId(dayId) {
  const result = await db.execute({
    sql: "SELECT * FROM problems WHERE day_id = ?",
    args: [dayId],
  });
  return result.rows;
}

async function getAllProblems() {
  const result = await db.execute(
    "SELECT * FROM problems ORDER BY day_id ASC, id ASC"
  );
  return result.rows;
}

async function getProblemById(id) {
  const result = await db.execute({
    sql: "SELECT * FROM problems WHERE id = ?",
    args: [id],
  });
  return result.rows[0] || null;
}

// ─── Submissions ─────────────────────────────────────────────────────────────

async function createSubmission(userId, problemId) {
  const result = await db.execute({
    sql: "INSERT OR IGNORE INTO submissions (user_id, problem_id) VALUES (?, ?)",
    args: [userId, problemId],
  });
  return { lastInsertRowid: Number(result.lastInsertRowid) };
}

async function getSubmissionsByUser(userId) {
  const result = await db.execute({
    sql: "SELECT * FROM submissions WHERE user_id = ?",
    args: [userId],
  });
  return result.rows;
}

async function getAllSubmissions() {
  const result = await db.execute("SELECT * FROM submissions");
  return result.rows;
}

async function deleteSubmission(userId, problemId) {
  return await db.execute({
    sql: "DELETE FROM submissions WHERE user_id = ? AND problem_id = ?",
    args: [userId, problemId],
  });
}

// ─── Point Config ─────────────────────────────────────────────────────────────

async function getPointConfig() {
  const result = await db.execute(
    "SELECT * FROM point_config WHERE id = 1"
  );
  return result.rows[0] || null;
}

async function updatePointConfig(
  tier1Hrs,
  tier2Hrs,
  tier3Hrs,
  tier1Pts,
  tier2Pts,
  tier3Pts
) {
  return await db.execute({
    sql: "UPDATE point_config SET tier1_hrs=?, tier2_hrs=?, tier3_hrs=?, tier1_pts=?, tier2_pts=?, tier3_pts=? WHERE id=1",
    args: [tier1Hrs, tier2Hrs, tier3Hrs, tier1Pts, tier2Pts, tier3Pts],
  });
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

async function getLeaderboard() {
  const pointConfig = await getPointConfig();
  const users = await getAllUsers();
  const submissions = await getAllSubmissions();
  const problems = await getAllProblems();
  const days = await getAllDays();

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
      total += calcPoints(s.done_at, day.started_at, pointConfig);
    });
    return { id: u.id, username: u.username, total };
  });

  return userScores.sort((a, b) => b.total - a.total);
}

// Full standings for admin (per problem breakdown)
async function getFullStandings() {
  const pointConfig = await getPointConfig();
  const users = await getAllUsers();
  const submissions = await getAllSubmissions();
  const problems = await getAllProblems();
  const days = await getAllDays();

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
        const pts = calcPoints(sub.done_at, day.started_at, pointConfig);
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

async function exportAllData() {
  const [users, days, problems, submissions, pointConfig] = await Promise.all([
    db.execute("SELECT * FROM users"),
    db.execute("SELECT * FROM days"),
    db.execute("SELECT * FROM problems"),
    db.execute("SELECT * FROM submissions"),
    getPointConfig(),
  ]);

  return {
    exported_at: new Date().toISOString(),
    users: users.rows,
    days: days.rows,
    problems: problems.rows,
    submissions: submissions.rows,
    point_config: pointConfig,
  };
}

async function importAllData(data) {
  const stmts = [
    "DELETE FROM submissions",
    "DELETE FROM problems",
    "DELETE FROM days",
    "DELETE FROM users",
    "DELETE FROM point_config",
  ];

  // Insert users
  (data.users || []).forEach((u) => {
    stmts.push({
      sql: "INSERT INTO users (id, username, password, created_at) VALUES (?, ?, ?, ?)",
      args: [u.id, u.username, u.password, u.created_at],
    });
  });

  // Insert days
  (data.days || []).forEach((d) => {
    stmts.push({
      sql: "INSERT INTO days (id, day_number, title, poster_path, reading_material, started_at, is_open) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [
        d.id,
        d.day_number,
        d.title,
        d.poster_path,
        d.reading_material,
        d.started_at,
        d.is_open,
      ],
    });
  });

  // Insert problems
  (data.problems || []).forEach((p) => {
    stmts.push({
      sql: "INSERT INTO problems (id, day_id, name, external_link, description) VALUES (?, ?, ?, ?, ?)",
      args: [p.id, p.day_id, p.name, p.external_link, p.description],
    });
  });

  // Insert submissions
  (data.submissions || []).forEach((s) => {
    stmts.push({
      sql: "INSERT INTO submissions (id, user_id, problem_id, done_at) VALUES (?, ?, ?, ?)",
      args: [s.id, s.user_id, s.problem_id, s.done_at],
    });
  });

  // Insert point config
  const pc = data.point_config || {};
  stmts.push({
    sql: "INSERT INTO point_config (id, tier1_hrs, tier2_hrs, tier3_hrs, tier1_pts, tier2_pts, tier3_pts) VALUES (1, ?, ?, ?, ?, ?, ?)",
    args: [
      pc.tier1_hrs || 24,
      pc.tier2_hrs || 48,
      pc.tier3_hrs || 168,
      pc.tier1_pts || 3,
      pc.tier2_pts || 2,
      pc.tier3_pts || 1,
    ],
  });

  await db.batch(stmts, "write");
}

module.exports = {
  initDatabase,
  createUser,
  getUserByUsername,
  getUserById,
  getAllUsers,
  updateUserPassword,
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