const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const config = require("../config");
const db = require("./db");

const app = express();

// ─── Uploads Dir ────────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ─── Multer Setup ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|json/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype) || file.mimetype === "application/json";
    if (ext && mime) cb(null, true);
    else cb(new Error("Only image files and JSON allowed"));
  },
});

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, config.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

function adminMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    if (!decoded.isAdmin) return res.status(403).json({ error: "Admin only" });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ─── Auth Routes ─────────────────────────────────────────────────────────────

// Register
app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });
  if (username.toLowerCase() === config.ADMIN_USERNAME.toLowerCase())
    return res.status(400).json({ error: "Username not allowed" });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.createUser(username.trim(), hashed);
    const token = jwt.sign(
      { id: result.lastInsertRowid, username: username.trim(), isAdmin: false },
      config.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, username: username.trim(), isAdmin: false });
  } catch (e) {
    if (e.message.includes("UNIQUE")) {
      res.status(400).json({ error: "Username already taken" });
    } else {
      res.status(500).json({ error: "Server error" });
    }
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  // Check admin
  if (
    username === config.ADMIN_USERNAME &&
    password === config.ADMIN_PASSWORD
  ) {
    const token = jwt.sign(
      { id: 0, username: config.ADMIN_USERNAME, isAdmin: true },
      config.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return res.json({ token, username: config.ADMIN_USERNAME, isAdmin: true });
  }

  const user = await db.getUserByUsername(username.trim());
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, username: user.username, isAdmin: false },
    config.JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({ token, username: user.username, isAdmin: false });
});

// ─── Public Routes ────────────────────────────────────────────────────────────

// Public leaderboard
app.get("/api/leaderboard", async (req, res) => {
  try {
    res.json(await db.getLeaderboard());
  } catch (e) {
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
});

// ─── Participant Routes ────────────────────────────────────────────────────────

// Get my progress
app.get("/api/me/progress", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const pointConfig = await db.getPointConfig();
    const subs = await db.getSubmissionsByUser(userId);
    const problems = await db.getAllProblems();
    const days = await db.getAllDays();

    const dayMap = {};
    days.forEach((d) => (dayMap[d.id] = d));
    const problemMap = {};
    problems.forEach((p) => (problemMap[p.id] = p));

    const result = subs.map((s) => {
      const problem = problemMap[s.problem_id];
      const day = problem ? dayMap[problem.day_id] : null;
      const pts = day ? db.calcPoints(s.done_at, day.started_at, pointConfig) : 0;
      return {
        submission: s,
        problem,
        day,
        points: pts,
      };
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: "Failed to load progress" });
  }
});

// Change own password
app.post("/api/me/change-password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: "Current and new password required" });
  if (newPassword.length < 3)
    return res.status(400).json({ error: "New password must be at least 3 characters" });

  const user = await db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) return res.status(401).json({ error: "Current password is incorrect" });

  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.updateUserPassword(req.user.id, hashed);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Get latest day with problems
app.get("/api/days/latest", authMiddleware, async (req, res) => {
  try {
    const day = await db.getLatestDay();
    if (!day) return res.json(null);
    const problems = await db.getProblemsByDayId(day.id);
    const userSubs = await db.getSubmissionsByUser(req.user.id);
    const solvedIds = new Set(userSubs.map((s) => s.problem_id));
    res.json({ day, problems, solvedIds: [...solvedIds] });
  } catch (e) {
    res.status(500).json({ error: "Failed to load latest day" });
  }
});

// Get all days with problems (for previous days browser)
app.get("/api/days", authMiddleware, async (req, res) => {
  try {
    const days = await db.getAllDays();
    const userSubs = await db.getSubmissionsByUser(req.user.id);
    const solvedIds = new Set(userSubs.map((s) => s.problem_id));
    const result = [];
    for (const d of days) {
      result.push({
        day: d,
        problems: await db.getProblemsByDayId(d.id),
        solvedIds: [...solvedIds],
      });
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: "Failed to load days" });
  }
});

// Mark problem as done
app.post("/api/submissions", authMiddleware, async (req, res) => {
  try {
    const { problem_id } = req.body;
    if (!problem_id) return res.status(400).json({ error: "problem_id required" });

    const problem = await db.getProblemById(problem_id);
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    const day = await db.getDayById(problem.day_id);
    if (!day) return res.status(404).json({ error: "Day not found" });
    if (!day.is_open) return res.status(403).json({ error: "Day is closed for submissions" });

    // Check not already submitted
    const existing = (await db.getSubmissionsByUser(req.user.id)).find(
      (s) => s.problem_id === problem_id
    );
    if (existing) return res.status(400).json({ error: "Already submitted" });

    await db.createSubmission(req.user.id, problem_id);
    const pointConfig = await db.getPointConfig();
    const pts = db.calcPoints(new Date().toISOString(), day.started_at, pointConfig);
    res.json({ success: true, points: pts });
  } catch (e) {
    res.status(500).json({ error: "Failed to create submission" });
  }
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────

// Create new day with problems
app.post(
  "/api/admin/days",
  adminMiddleware,
  upload.single("poster"),
  async (req, res) => {
    try {
      const { day_number, title, reading_material, problems } = req.body;
      if (!day_number || !title)
        return res.status(400).json({ error: "day_number and title required" });

      const posterPath = req.file ? req.file.filename : null;
      const dayResult = await db.createDay(
        parseInt(day_number),
        title,
        posterPath,
        reading_material || null
      );
      const dayId = dayResult.lastInsertRowid;

      // problems comes as JSON string from FormData
      let parsedProblems = [];
      try {
        parsedProblems = JSON.parse(problems || "[]");
      } catch {
        parsedProblems = [];
      }

      for (const p of parsedProblems) {
        if (p.name) await db.createProblem(dayId, p.name, p.external_link || null, p.description || null);
      }

      const day = await db.getDayById(dayId);
      const dayProblems = await db.getProblemsByDayId(dayId);
      res.json({ day, problems: dayProblems });
    } catch (e) {
      res.status(500).json({ error: "Failed to create day" });
    }
  }
);

// Toggle day open/closed
app.patch("/api/admin/days/:id/toggle", adminMiddleware, async (req, res) => {
  try {
    const day = await db.getDayById(parseInt(req.params.id));
    if (!day) return res.status(404).json({ error: "Day not found" });
    await db.updateDayOpenStatus(day.id, !day.is_open);
    res.json({ success: true, is_open: !day.is_open });
  } catch (e) {
    res.status(500).json({ error: "Failed to toggle day" });
  }
});

// Delete day and related data
app.delete("/api/admin/days/:id", adminMiddleware, async (req, res) => {
  try {
    const dayId = parseInt(req.params.id);
    const day = await db.getDayById(dayId);
    if (!day) return res.status(404).json({ error: "Day not found" });

    await db.deleteDay(dayId);

    if (day.poster_path) {
      const posterFile = path.join(UPLOADS_DIR, day.poster_path);
      if (fs.existsSync(posterFile)) {
        try {
          fs.unlinkSync(posterFile);
        } catch (err) {
          console.warn("Failed to delete poster file:", err);
        }
      }
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete day" });
  }
});

// Get all days (admin)
app.get("/api/admin/days", adminMiddleware, async (req, res) => {
  try {
    const days = await db.getAllDays();
    const result = [];
    for (const d of days) {
      result.push({
        day: d,
        problems: await db.getProblemsByDayId(d.id),
      });
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: "Failed to load days" });
  }
});

// Full standings
app.get("/api/admin/standings", adminMiddleware, async (req, res) => {
  try {
    const standings = await db.getFullStandings();
    const problems = await db.getAllProblems();
    const days = await db.getAllDays();
    res.json({ standings, problems, days });
  } catch (e) {
    res.status(500).json({ error: "Failed to load standings" });
  }
});

// Get point config
app.get("/api/admin/point-config", adminMiddleware, async (req, res) => {
  try {
    res.json(await db.getPointConfig());
  } catch (e) {
    res.status(500).json({ error: "Failed to load point config" });
  }
});

// Update point config
app.put("/api/admin/point-config", adminMiddleware, async (req, res) => {
  try {
    const { tier1_hrs, tier2_hrs, tier3_hrs, tier1_pts, tier2_pts, tier3_pts } = req.body;
    await db.updatePointConfig(tier1_hrs, tier2_hrs, tier3_hrs, tier1_pts, tier2_pts, tier3_pts);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to update point config" });
  }
});

// Admin undo a submission
app.delete("/api/admin/submissions", adminMiddleware, async (req, res) => {
  try {
    const { user_id, problem_id } = req.body;
    if (!user_id || !problem_id)
      return res.status(400).json({ error: "user_id and problem_id required" });
    await db.deleteSubmission(user_id, problem_id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete submission" });
  }
});

// Admin reset a user's password to "default"
app.post("/api/admin/reset-password", adminMiddleware, async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: "user_id required" });

  const user = await db.getUserById(user_id);
  if (!user) return res.status(404).json({ error: "User not found" });

  try {
    const hashed = await bcrypt.hash("default", 10);
    await db.updateUserPassword(user_id, hashed);
    res.json({ success: true, username: user.username });
  } catch (e) {
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Get all users (admin)
app.get("/api/admin/users", adminMiddleware, async (req, res) => {
  try {
    res.json(await db.getAllUsers());
  } catch (e) {
    res.status(500).json({ error: "Failed to load users" });
  }
});

// Export all data
app.get("/api/admin/export", adminMiddleware, async (req, res) => {
  try {
    const data = await db.exportAllData();
    const filename = `codesprint-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/json");
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to export data" });
  }
});

// Import all data
app.post(
  "/api/admin/import",
  adminMiddleware,
  upload.single("backup"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    try {
      const raw = fs.readFileSync(req.file.path, "utf-8");
      const data = JSON.parse(raw);
      await db.importAllData(data);
      // Clean up temp file
      fs.unlinkSync(req.file.path);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Invalid backup file: " + e.message });
    }
  }
);

// ─── Serve Client ────────────────────────────────────────────────────────────
const clientDistPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientDistPath));

// Catch-all route for client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// ─── Start (connect to Turso first, then listen) ─────────────────────────────
db.initDatabase()
  .then(() => {
    app.listen(config.PORT, () => {
      console.log(`\n🔴 COPS Code Sprint Server running on port ${config.PORT}\n`);
    });
  })
  .catch((err) => {
    console.error("Fatal: Could not initialize database", err);
    process.exit(1);
  });