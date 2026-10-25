# AZHARIX College Management System — Phase 1

White-first college management system starter for local development. This phase implements the admin foundation:
- React + Vite frontend with white / royal-blue / gold styling
- Express API
- PostgreSQL + Prisma schema
- Login and role-based API protection
- Admin dashboard metrics from the database
- Student listing and student registration
- Initial models for fees, attendance, exams, leave requests, audit logs, and future portals

## Requirements
- Node.js 20+ (LTS recommended)
- PostgreSQL 15+
- VS Code

## 1. Configure PostgreSQL
Create a database named `azharix_college`. Example using `psql`:

```sql
CREATE DATABASE azharix_college;
```

## 2. Configure the backend
Open a terminal in `server`:

```bash
npm install
```

Copy `.env.example` to `.env`, then set `DATABASE_URL` for your PostgreSQL installation and a long random `JWT_SECRET`.

Example (change username/password for your computer):
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/azharix_college?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=4000
CLIENT_ORIGIN="http://localhost:5173"
```

Run database migrations and create a demo admin:
```bash
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Demo account created by seed:
- Email: `admin@azharix.local`
- Password: `ChangeMe123!`

Change this password immediately after first login. Demo credentials are for local development only. Do not deploy them publicly.

## 3. Start the frontend
Open a second terminal in `client`:

```bash
npm install
npm run dev
```

Open the local URL Vite prints, usually `http://localhost:5173`.

## 4. Common commands
Backend:
- `npm run dev` — API with auto-reload
- `npm run seed` — creates demo admin if not present
- `npx prisma studio` — visual database browser
- `npx prisma migrate dev --name your_change` — create a migration

Frontend:
- `npm run dev` — local development server
- `npm run build` — production build

## Project structure
```text
AZHARIX-College-Management/
  client/   React frontend
  server/   Express API, Prisma schema and seed
```

## Security notes
- API passwords are hashed with bcrypt.
- JWT is stored in browser memory for this starter, not localStorage.
- API routes enforce role checks on the server.
- Configure HTTPS, secure deployment secrets, rate limiting, backups, email reset flow, and a production-grade session strategy before public launch.
- This is Phase 1. Student and Teacher self-service portals, full fee workflows, exam workflows, and approvals are planned next. The database already contains starting models for expansion.
