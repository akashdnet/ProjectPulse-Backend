# Backend Implementation Blueprint: ProjectPulse

## 1. Project Overview & Tech Stack
**Objective:** Build a role-based project submission, review, and admin management dashboard with Role-Based Access Control (RBAC).  
**Roles:** `STUDENT`, `MENTOR`, `ADMIN`  
**Tech Stack:** Node.js, Express.js, TypeScript, PostgreSQL, Prisma ORM, Zod (Validation), JWT (Authentication), bcrypt (Password Hashing).  
**Architecture:** Modular MVC + Service Layer Pattern.

---

## 2. Directory Structure
```text
src/
├── app/
│   ├── modules/
│   │   ├── auth/          # auth.controller.ts, auth.service.ts, auth.route.ts, auth.validation.ts
│   │   ├── user/          # user.controller.ts, user.service.ts, user.route.ts, user.validation.ts (Admin User CRUD & Soft Delete)
│   │   ├── submission/    # submission.controller.ts, submission.service.ts, submission.route.ts, submission.validation.ts
│   │   └── dashboard/     # dashboard.controller.ts, dashboard.service.ts, dashboard.route.ts, dashboard.validation.ts
│   ├── middlewares/
│   │   ├── authGuard.ts   # JWT verification and RBAC checker (STUDENT, MENTOR, ADMIN)
│   │   ├── rateLimiter.ts # express-rate-limit configuration (5 req / 15 min)
│   │   ├── requestLogger.ts # Real-time route hit, duration, success & error logger
│   │   ├── validateRequest.ts # Zod validation middleware
│   │   └── globalErrorHandler.ts # Handles Zod, Prisma, and custom AppError with console logs
│   └── utils/
│       ├── AppError.ts    # Custom application error class
│       ├── catchAsync.ts  # Try-catch wrapper for controllers
│       ├── prisma.ts      # Singleton Prisma client instance
│       └── sendResponse.ts # Standardized API response formatter with console log
├── routes/
│   └── index.ts          # Main router aggregating all module routes
├── prisma/
│   ├── schema.prisma     # Database models & enums
│   └── seed.ts           # Single seed script for Super Admin creation/checking
├── types/
│   └── index.ts          # Shared TypeScript definitions and Express user extension
├── app.ts                # Express app setup, CORS, requestLogger, 404 & Error handlers
└── server.ts             # App initialization, super admin check, and server listening
```

---

## 3. Database Schema (schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  STUDENT
  MENTOR
  ADMIN
}

enum UserStatus {
  PENDING
  ACTIVE
  BLOCKED
}

enum ProjectStatus {
  PENDING
  APPROVED
  REJECTED
}

model User {
  id          String       @id @default(uuid())
  name        String
  email       String       @unique
  password    String
  role        Role         @default(STUDENT)
  status      UserStatus   @default(ACTIVE)
  isDeleted   Boolean      @default(false)
  deletedAt   DateTime?
  submissions Submission[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@map("users")
}

model Submission {
  id          String        @id @default(uuid())
  projectName String
  repoUrl     String
  liveLink    String
  description String
  status      ProjectStatus @default(PENDING)
  
  studentId   String
  student     User          @relation(fields: [studentId], references: [id])
  
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@unique([studentId, repoUrl]) // Prevents duplicate submissions of the same repo by the same student
  @@index([status]) // Optimizes filtering by status
  @@map("submissions")
}
```

---

## 4. Seeding & Super Admin Strategy
- **Single Source of Truth:** [`src/prisma/seed.ts`](src/prisma/seed.ts) contains the sole seed logic.
- **Environment Variables:** `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` defined in `.env`.
- **Startup Auto-Check:** In [`src/server.ts`](src/server.ts), before the server binds to the port (`app.listen`), `seedSuperAdmin()` runs:
  - If super admin exists: Logs `ℹ Super admin already exists: <email>`.
  - If not exists: Hashes password, creates user with `role: ADMIN`, and logs `✓ Super admin created successfully: <email>`.
- **CLI Seed Command:** Running `npm run seed` invokes the exact same function.

---

## 5. API Endpoints & Implementation Logic

### Module 1: Auth Module (`/api/v1/auth`)

#### 1.1 Signup (`POST /api/v1/auth/signup`)
* **Access:** Public
* **Payload:** `name` (string), `email` (string, email format), `password` (string, min 6 chars), `role` (optional: `'STUDENT'` or `'MENTOR'`, default `'STUDENT'`).
* **Service Logic:**
  1. Check if user already exists with the email. If yes, throw 409 Conflict.
  2. Hash the password using `bcrypt` (salt rounds: 10).
  3. **Role-Based Status Logic:**
     - If `role` is `STUDENT`: account is created with `status: ACTIVE` (immediate auto-approval).
     - If `role` is `MENTOR`: account is created with `status: PENDING` (requires Admin approval to prevent self-evaluating submissions).
  4. Create user in DB and exclude password from the response.
* **Success Response:** 201 Created.

#### 1.2 Login (`POST /api/v1/auth/login`)
* **Access:** Public
* **Payload:** `email` (string), `password` (string).
* **Service Logic:**
  1. Find user by email. If not found, throw 404 Error.
  2. Check `isDeleted` status. If `true`, throw 403 Forbidden (`This account has been deactivated or deleted!`).
  3. **Check `status`:**
     - If `status === 'PENDING'`: throw 403 Forbidden (`Your mentor account is pending approval by an administrator...`).
     - If `status === 'BLOCKED'`: throw 403 Forbidden (`Your account has been suspended or blocked.`).
  4. Compare password using `bcrypt.compare`. If invalid, throw 401 Error.
  5. Generate JWT Token (payload: `id`, `email`, `role`, `status`). Expiry: '7d'.
* **Success Response:** 200 OK. Return token and user profile (without password).

---

### Module 2: User Management & Admin CRUD (`/api/v1/users`)
* **Access:** Strictly Protected -> `authGuard(Role.ADMIN)`

#### 2.1 Create User (`POST /api/v1/users`)
* **Payload:** `name` (string), `email` (string), `password` (string, min 6), `role` (optional: `STUDENT`, `MENTOR`, `ADMIN`), `status` (optional: `ACTIVE`, `PENDING`, `BLOCKED`).
* **Service Logic:** Validates payload with Zod, checks email uniqueness, hashes password, and creates user with assigned role and status.
* **Success Response:** 201 Created.

#### 2.2 Get All Users (`GET /api/v1/users`)
* **Query Parameters:** `page`, `limit`, `role`, `status`, `searchTerm`, `includeDeleted` (default: false).
* **Service Logic:**
  1. Exclude soft-deleted users (`isDeleted: false`) unless `includeDeleted=true`.
  2. Filter by `role` and `status` (e.g. `?status=PENDING&role=MENTOR` to see mentors awaiting approval).
  3. Search by `name` or `email` (case-insensitive) if specified.
  4. Return paginated array of users with metadata (`total`, `page`, `limit`, `totalPages`).
* **Success Response:** 200 OK.

#### 2.3 Get User by ID (`GET /api/v1/users/:id`)
* **Service Logic:** Fetch single user details including their submissions list. If not found, throw 404.
* **Success Response:** 200 OK.

#### 2.4 Update User (`PATCH /api/v1/users/:id`)
* **Payload:** `name`, `email`, `role`, `status`, `password`, `isDeleted` (all optional).
* **Service Logic:**
  1. If email is updated, check if new email is already taken.
  2. If password is provided, hash with bcrypt.
  3. Update user in DB and return updated record.
* **Success Response:** 200 OK.

#### 2.5 Approve / Update User Status (`PATCH /api/v1/users/:id/status`)
* **Payload:** `status` (`'ACTIVE'`, `'PENDING'`, or `'BLOCKED'`).
* **Service Logic:**
  1. Check if user exists. If not, throw 404.
  2. Update `status` in DB.
  3. Used by Admin to approve pending mentor accounts or block accounts.
* **Success Response:** 200 OK (`User status updated to 'ACTIVE' successfully!`).

#### 2.6 Soft Delete User (`DELETE /api/v1/users/:id`)
* **Service Logic:**
  1. Check if user exists. If already deleted, throw 400.
  2. Prevent deleting the primary configured Super Admin account (403 Forbidden).
  3. Perform **soft delete**: update user with `isDeleted: true` and `deletedAt: new Date()`.
  4. The record remains intact in PostgreSQL for auditing/recovery.
* **Success Response:** 200 OK (`User soft-deleted successfully!`).

#### 2.7 Restore Soft-Deleted User (`PATCH /api/v1/users/:id/restore`)
* **Service Logic:** Revert soft-deleted user by setting `isDeleted: false` and `deletedAt: null`.
* **Success Response:** 200 OK (`User restored successfully!`).

---

### Module 3: Submission Module (`/api/v1/submissions`)

#### 3.1 Submit Project (`POST /api/v1/submissions`)
* **Access:** Protected -> `authGuard(Role.STUDENT)`
* **Middleware required:** `rateLimiter` (5 requests per 15 minutes).
* **Payload Verification (Zod):** 
  * `projectName` (string, min 3)
  * `repoUrl` (string, strictly valid URL)
  * `liveLink` (string, strictly valid URL)
  * `description` (string, min 10)
* **Service Logic:**
  1. Extract `studentId` from the decoded JWT token.
  2. Check if a submission with the exact same `studentId` AND `repoUrl` already exists (409 Conflict).
  3. Create submission in DB with status `PENDING`.
* **Success Response:** 201 Created.

---

### Module 4: Dashboard Module (`/api/v1/dashboard`)

#### 4.1 Get All Submissions (`GET /api/v1/dashboard/submissions`)
* **Access:** Protected -> `authGuard(Role.MENTOR)`
* **Query Parameters:** `page`, `limit`, `status` (APPROVED / REJECTED / PENDING).
* **Service Logic:** Paginated query with student details (name, email) included.
* **Success Response:** 200 OK.

#### 4.2 Update Submission Status (`PATCH /api/v1/dashboard/submissions/:id/status`)
* **Access:** Protected -> `authGuard(Role.MENTOR)`
* **Payload:** `status` ("APPROVED" or "REJECTED").
* **Service Logic:** Validate status and update in DB.
* **Success Response:** 200 OK.

#### 4.3 Get Aggregated Statistics (`GET /api/v1/dashboard/stats`)
* **Access:** Protected -> `authGuard(Role.MENTOR)`
* **Service Logic:** Run `prisma.submission.groupBy` by status.
* **Success Response:** 200 OK (`{ totalPending, totalApproved, totalRejected }`).

---

## 6. Console Logging & Debugging Flow
Every request is intercepted by [`src/app/middlewares/requestLogger.ts`](src/app/middlewares/requestLogger.ts):
```text
📥 [ROUTE HIT] <METHOD> <URL> at <TIME>
💬 [SUCCESS MESSAGE] <Response message>
✅ [SUCCESS <STATUS>] <METHOD> <URL> (took <X>ms)

💥 [ERROR HANDLER] <METHOD> <URL> -> Status: <STATUS> | Message: <MESSAGE>
❌ [ERROR <STATUS>] <METHOD> <URL> (took <X>ms)

⚠️ [NOT FOUND 404] <METHOD> <URL>
```

---

## 7. Standardized Response & Error Format

### Success Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User updated successfully!",
  "meta": { "page": 1, "limit": 10, "total": 50, "totalPages": 5 },
  "data": { ... }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "This account has been deactivated or deleted!",
  "errorDetails": [ ... ],
  "stack": "..."
}
```
