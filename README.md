# Pulse

A production-ready starter for a chronological social posts app: React (Vite) frontend, Node.js/Express backend, MySQL database.

- **Feed** is strictly newest-first — no trending algorithm, just a live chronological stream.
- **Hashtags** are auto-extracted from post text (`#topic`) and stored relationally.
- **Auth** is JWT-based with bcrypt-hashed passwords.
- **Likes** are toggled per user, with an atomic counter on the post.

## Stack

| Layer    | Tech                                              |
|----------|----------------------------------------------------|
| Frontend | React 18, Vite, React Router                       |
| Backend  | Node.js, Express, JWT, bcrypt, express-validator    |
| Database | MySQL 8 (mysql2 driver, connection pooling)         |

## Project layout

```
pulse-app/
  backend/
    server.js              Express app entry point
    src/config/db.js       MySQL connection pool
    src/middleware/        auth, error handling, rate limiting
    src/controllers/       auth + post business logic
    src/routes/            route definitions
    src/utils/             hashtag extraction, input validation
    sql/schema.sql         database schema
  frontend/
    src/api/client.js      fetch wrapper for the backend API
    src/context/           auth state (JWT + user)
    src/components/        Navbar, ComposeBox, PostCard
    src/pages/             Feed, Login, Register
    src/styles/index.css   design system
```

## Local setup

### 1. Database

```bash
mysql -u root -p < backend/sql/schema.sql
```

This creates the `trending_app` database and all tables. Create an app-specific MySQL user rather than using root in production:

```sql
CREATE USER 'pulse_app'@'%' IDENTIFIED BY 'a-strong-password';
GRANT SELECT, INSERT, UPDATE, DELETE ON trending_app.* TO 'pulse_app'@'%';
FLUSH PRIVILEGES;
```

### 2. Backend

```bash
cd backend
cp .env.example .env      # fill in DB credentials and a real JWT_SECRET
npm install
npm run dev                # nodemon, http://localhost:4000
```

Generate a strong `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env      # VITE_API_URL, defaults to http://localhost:4000/api
npm install
npm run dev                # http://localhost:5173
```

## API summary

| Method | Path                | Auth      | Description                          |
|--------|---------------------|-----------|---------------------------------------|
| POST   | /api/auth/register   | —         | Create an account, returns JWT        |
| POST   | /api/auth/login      | —         | Log in, returns JWT                   |
| GET    | /api/posts           | optional  | Paginated feed, newest first          |
| POST   | /api/posts           | required  | Create a post (extracts `#hashtags`)  |
| POST   | /api/posts/:id/like  | required  | Toggle a like on a post               |

`GET /api/posts` accepts `?page=1&pageSize=20` (pageSize capped at 50).

## Production checklist

This starter is functionally production-ready, but before deploying:

- **Secrets**: never commit `.env`. Use your platform's secret manager (AWS Secrets Manager, environment variables in your host, etc.) for `JWT_SECRET` and `DB_PASSWORD`.
- **Database**: use a managed MySQL instance (RDS, PlanetScale, Cloud SQL) with automated backups. Run `sql/schema.sql` as a migration, and track future schema changes with a migration tool (e.g. `db-migrate`, `Flyway`, `Prisma Migrate`) rather than hand-editing.
- **HTTPS**: terminate TLS at a reverse proxy (nginx, Caddy, or your cloud load balancer) in front of the Express app. Never expose port 4000 directly to the internet.
- **CORS**: set `CORS_ORIGIN` to your real frontend domain, not `*`.
- **Process management**: run the backend under a supervisor (`pm2`, systemd, or a container orchestrator) so it restarts on crash.
- **Frontend build**: `npm run build` in `frontend/` produces static files in `dist/` — serve them via a CDN or static host (Vercel, Netlify, S3+CloudFront, or nginx).
- **Rate limiting**: the included limiter is in-memory and per-instance. If you scale the backend horizontally, move to a shared store (Redis) via `rate-limit-redis`.
- **Logging/monitoring**: replace `console.error` in `errorHandler.js` with structured logging (pino/winston) shipped to your observability stack.
- **Connection pool sizing**: tune `connectionLimit` in `src/config/db.js` to your MySQL instance's `max_connections` and expected concurrency.
- **Content moderation**: there's no profanity/spam filtering — add it before opening registration publicly.

## Notes on design choices

- Passwords are hashed with bcrypt (cost factor 12); plaintext passwords are never stored or logged.
- Auth errors return a generic "Invalid email or password" to avoid revealing whether an email is registered.
- Hashtag inserts use `INSERT ... ON DUPLICATE KEY UPDATE` and `INSERT IGNORE` to stay race-safe under concurrent posts using the same tag.
- Post creation and like toggling run inside MySQL transactions so the post/hashtag/like rows and their counters never drift out of sync.
