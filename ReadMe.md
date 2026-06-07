# Code Sprint June 2026 — COPS

Stranger Things themed coding marathon progress tracker with leaderboard.

## Stack
- **Frontend:** React + Vite (port 5173)
- **Backend:** Node.js + Express (port 3001)
- **Database:** better-sqlite3 (file: `server/database.sqlite`)

---

## Setup

### 1. Install backend dependencies
```bash
# From root (code-sprint/)
npm install
```

### 2. Install frontend dependencies
```bash
cd client
npm install
cd ..
```

### 3. Configure admin credentials
Edit `config.js` before first run:
```js
ADMIN_USERNAME: "admin",          // change this
ADMIN_PASSWORD: "cops2026admin",  // change this
JWT_SECRET: "...",                // change this to a random string
```

### 4. Run backend
```bash
# From root
npm run dev         # with nodemon (auto-restart)
# or
npm start           # without nodemon
```

### 5. Run frontend
```bash
cd client
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3001

---

## Admin Login
Use the credentials from `config.js`.  
Admin account is **not** stored in the database — it's hardcoded.

## User Accounts
Anyone can register at the login page. No invite code required.

---

## Folder Structure
```
code-sprint/
├── config.js              # Admin creds, JWT secret, port
├── package.json           # Server deps
├── server/
│   ├── server.js          # All Express routes
│   ├── db.js              # All SQLite operations
│   ├── database.sqlite    # Auto-created on first run
│   └── uploads/           # Uploaded poster images (auto-created)
└── client/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        └── components/
            ├── Navbar.jsx
            ├── LoginRegister.jsx
            ├── Leaderboard.jsx
            ├── ParticipantDashboard.jsx
            ├── LatestDay.jsx
            ├── PreviousDays.jsx
            ├── AdminDashboard.jsx
            └── AdminStandings.jsx
```

---

## Point System (defaults, editable by admin)
| Solved within | Points |
|---|---|
| 24 hours | 3 pts |
| 48 hours | 2 pts |
| 1 week (168h) | 1 pt |
| After 1 week | 0 pts |

Admin can change these thresholds anytime from the **Point Config** tab.

---

## Switching Hosts / Migrating Data
1. Go to Admin → Backup tab
2. Click **Download Backup** — saves a JSON with all data
3. On new host, set up fresh install and run it
4. Go to Admin → Backup → Import, upload the JSON
5. Done. All users, days, problems, submissions restored.

> **Note:** Poster images are stored in `server/uploads/` — copy this folder manually when migrating.

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | — | Register |
| POST | /api/auth/login | — | Login |
| GET | /api/leaderboard | — | Public leaderboard |
| GET | /api/me/progress | User | My submissions + points |
| GET | /api/days/latest | User | Latest day + problems |
| GET | /api/days | User | All days + problems |
| POST | /api/submissions | User | Mark problem done |
| POST | /api/admin/days | Admin | Create new day |
| GET | /api/admin/days | Admin | All days (admin view) |
| PATCH | /api/admin/days/:id/toggle | Admin | Open/close a day |
| GET | /api/admin/standings | Admin | Full standings grid |
| GET | /api/admin/point-config | Admin | Get point config |
| PUT | /api/admin/point-config | Admin | Update point config |
| DELETE | /api/admin/submissions | Admin | Undo a submission |
| GET | /api/admin/export | Admin | Download backup JSON |
| POST | /api/admin/import | Admin | Restore from backup JSON |
| GET | /uploads/:filename | — | Serve poster images |