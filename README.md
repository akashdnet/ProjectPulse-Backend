# ProjectPulse Backend - Project Submission & Review Dashboard

A role-based project submission and review backend built with **Node.js**, **Express.js**, **TypeScript**, **PostgreSQL**, and **Prisma ORM**.

---

## 🚀 Tech Stack

- **Runtime & Language:** Node.js, TypeScript
- **Framework:** Express.js
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Validation:** Zod
- **Authentication & Security:** JWT (JSON Web Tokens), bcrypt
- **Rate Limiting:** express-rate-limit
- **Architecture:** Modular MVC + Service Layer Pattern

---

## 📁 Directory Structure

```text
src/
├── app/
│   ├── modules/
│   │   ├── auth/          # auth.controller.ts, auth.service.ts, auth.route.ts, auth.validation.ts
│   │   ├── user/          # user.controller.ts, user.service.ts, user.route.ts, user.validation.ts (Admin CRUD & Soft Delete)
│   │   ├── submission/    # submission.controller.ts, submission.service.ts, submission.route.ts, submission.validation.ts
│   │   └── dashboard/     # dashboard.controller.ts, dashboard.service.ts, dashboard.route.ts, dashboard.validation.ts
│   ├── middlewares/
│   │   ├── authGuard.ts   # JWT verification and RBAC checker (STUDENT, MENTOR, ADMIN)
│   │   ├── rateLimiter.ts # express-rate-limit configuration (5 req / 15 min for submissions)
│   │   ├── requestLogger.ts # Real-time route hit, success & error console logging
│   │   ├── validateRequest.ts # Zod validation middleware
│   │   └── globalErrorHandler.ts # Handles Zod, Prisma, and custom AppError with console logs
│   └── utils/
│       ├── AppError.ts    # Custom application error class
│       ├── catchAsync.ts  # Try-catch wrapper for async controllers
│       ├── prisma.ts      # Singleton Prisma client instance
│       └── sendResponse.ts # Standardized API response formatter with console log
├── routes/
│   └── index.ts          # Central router aggregating all module routes
├── prisma/
│   ├── schema.prisma     # Database models & enums (Role: STUDENT, MENTOR, ADMIN; Soft Delete)
│   └── seed.ts           # Single seed script for Super Admin creation/checking
├── types/
│   └── index.ts          # Shared TypeScript types, enums and Express user augmentation
├── app.ts                # Express app setup, CORS, requestLogger, 404 & error handlers
└── server.ts             # App bootstrap, super admin check, and graceful shutdown
```

---

## ⚙️ Setup & Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file using [.env.example](.env.example):
   ```env
   NODE_ENV=development
   PORT=5000
   DATABASE_URL="postgresql://postgres:admin@localhost:5432/project_pulse_db?schema=public"
   JWT_SECRET="<YOUR_SECURE_RANDOM_JWT_SECRET>"
   JWT_EXPIRES_IN="7d"
   BCRYPT_SALT_ROUNDS=10
   SUPER_ADMIN_EMAIL="superadmin@admin.com"
   SUPER_ADMIN_PASSWORD="adminadmin"
   ```

3. **Generate Prisma Client & Run Migrations:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Seed Super Admin User:**
   ```bash
   npm run seed
   ```
   *(Checks and creates default Super Admin account using `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` from `.env`. This check also runs automatically upon server startup).*

5. **Start Development Server:**
   ```bash
   npm run dev
   ```

---

## 📡 API Endpoints

### 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/signup` | Public | Register an account (`name`, `email`, `password`, `role`). `STUDENT` accounts are automatically approved (`ACTIVE`). `MENTOR` accounts are created as `PENDING` awaiting Admin approval. |
| `POST` | `/api/v1/auth/login` | Public | Login user and receive JWT token (`email`, `password`). Soft-deleted users and unapproved mentors (`PENDING`) are blocked with `403`. |

---

### 2. User Management & Admin CRUD (`/api/v1/users`)

> All routes under `/api/v1/users` are strictly protected and require `Role.ADMIN`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/users` | Protected (`ADMIN`) | Create any user with role (`STUDENT`, `MENTOR`, or `ADMIN`) and status |
| `GET` | `/api/v1/users` | Protected (`ADMIN`) | Get all users with pagination, role filter (`?role=MENTOR`), status filter (`?status=PENDING`), and search. Excludes soft-deleted users by default (`?includeDeleted=true` to include) |
| `GET` | `/api/v1/users/:id` | Protected (`ADMIN`) | Get single user details along with their submissions |
| `PATCH` | `/api/v1/users/:id` | Protected (`ADMIN`) | Modify user data (name, email, role, password, status) |
| `PATCH` | `/api/v1/users/:id/status` | Protected (`ADMIN`) | **Approve / Update account status** (`ACTIVE`, `PENDING`, `BLOCKED`). Admin uses this to approve pending mentor accounts |
| `DELETE` | `/api/v1/users/:id` | Protected (`ADMIN`) | **Soft delete** user (`isDeleted: true`, `deletedAt`). Primary Super Admin account is protected |
| `PATCH` | `/api/v1/users/:id/restore` | Protected (`ADMIN`) | Restore a soft-deleted user back to active status |

---

### 3. Submissions (`/api/v1/submissions`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/submissions` | Protected (`STUDENT`) | Submit project (`projectName`, `repoUrl`, `liveLink`, `description`) |

> Rate limited to **5 requests per 15 minutes**. Duplicate submission of the same repo by the same student is prevented with 409 Conflict.

---

### 4. Dashboard (`/api/v1/dashboard`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/dashboard/submissions` | Protected (`MENTOR`) | Get all submissions with pagination & status filter (`?page=1&limit=10&status=PENDING`) |
| `PATCH` | `/api/v1/dashboard/submissions/:id/status` | Protected (`MENTOR`) | Update submission status (`APPROVED` or `REJECTED`) |
| `GET` | `/api/v1/dashboard/stats` | Protected (`MENTOR`) | Aggregated submission count grouped by status |

---

## 🖥️ Real-time Console Logging

Every incoming request and outgoing response is tracked in the console for instant debugging:
- **Route Hit:** `🚀 [ROUTE HIT] POST /api/v1/auth/login at 8:00:00 PM`
- **Success:** `💬 [SUCCESS MESSAGE] User logged in successfully!` & `✅ [SUCCESS 200] POST /api/v1/auth/login (took 85ms)`
- **Error:** `💥 [ERROR HANDLER] POST /api/v1/auth/login -> Status: 401 | Message: Password does not match!` & `❌ [ERROR 401]`
- **404 Not Found:** `⚠️ [NOT FOUND 404] GET /api/v1/unknown-route` & `❌ [ERROR 404]`

---

## 🏗️ Build for Production

```bash
npm run build
npm start
```
