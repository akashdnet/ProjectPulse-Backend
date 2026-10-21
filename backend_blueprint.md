# Backend Implementation Blueprint: ProjectPulse

## 1. Project Overview & Tech Stack
**Objective:** Build a simple project submission and review dashboard with Role-Based Access Control (RBAC).  
**Tech Stack:** Node.js, Express.js, TypeScript, PostgreSQL, Prisma ORM, Zod (Validation), JWT (Authentication), bcrypt (Password Hashing).  
**Architecture:** Modular MVC + Service Layer Pattern.

---

## 2. Directory Structure
```text
src/
├── app/
│   ├── modules/
│   │   ├── auth/          # auth.controller.ts, auth.service.ts, auth.route.ts, auth.validation.ts
│   │   ├── submission/    # submission.controller.ts, submission.service.ts, submission.route.ts, submission.validation.ts
│   │   └── dashboard/     # dashboard.controller.ts, dashboard.service.ts, dashboard.route.ts, dashboard.validation.ts
│   ├── middlewares/
│   │   ├── authGuard.ts   # JWT verification and RBAC checker
│   │   ├── rateLimiter.ts # express-rate-limit configuration
│   │   ├── validateRequest.ts # Zod validation middleware
│   │   └── globalErrorHandler.ts # Handles generic & Prisma specific errors
│   └── utils/
│       ├── AppError.ts    # Custom application error class
│       ├── catchAsync.ts  # Try-catch wrapper for controllers
│       ├── prisma.ts      # Singleton Prisma client instance
│       └── sendResponse.ts # Standardized API response formatter
├── routes/
│   └── index.ts          # Main router aggregating all module routes
├── prisma/
│   ├── schema.prisma     # Database models
│   └── seed.ts           # Script to create initial MENTOR user
├── types/
│   └── index.ts          # Shared TypeScript definitions and Express user extension
├── app.ts                # Express app setup, CORS, Middleware injection
└── server.ts             # App initialization and server listening
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

## 4. API Endpoints & Implementation Logic

### Module 1: Auth Module (`/api/v1/auth`)

#### 1.1 Signup (`POST /api/v1/auth/signup`)
* **Access:** Public
* **Payload:** `name` (string), `email` (string, email format), `password` (string, min 6 chars).
* **Service Logic:**
  1. Check if user already exists with the email. If yes, throw 409 Error.
  2. Hash the password using `bcrypt` (salt rounds: 10).
  3. Create user in DB (Default role: `STUDENT`).
  4. Exclude password from the returned response.
* **Success Response:** 201 Created. 

#### 1.2 Login (`POST /api/v1/auth/login`)
* **Access:** Public
* **Payload:** `email` (string), `password` (string).
* **Service Logic:**
  1. Find user by email. If not found, throw 404 Error.
  2. Compare password using `bcrypt.compare`. If invalid, throw 401 Error.
  3. Generate JWT Token (payload: `id`, `email`, `role`). Expiry: '7d'.
* **Success Response:** 200 OK. Return token and user info (without password).

---

### Module 2: Submission Module (`/api/v1/submissions`)

#### 2.1 Submit Project (`POST /api/v1/submissions`)
* **Access:** Protected -> `authGuard('STUDENT')`
* **Middleware required:** `rateLimiter` (Limit: 5 requests per 15 minutes).
* **Payload Verification (Zod):** 
  * `projectName` (string, min 3)
  * `repoUrl` (string, strictly valid URL)
  * `liveLink` (string, strictly valid URL)
  * `description` (string, min 10)
* **Service Logic:**
  1. Extract `studentId` from the decoded JWT token.
  2. Check if a submission with the exact same `studentId` AND `repoUrl` already exists. If yes, throw 409 Duplicate Submission Error.
  3. Create submission in DB with status `PENDING`.
* **Success Response:** 201 Created. Return created submission data.

---

### Module 3: Dashboard Module (`/api/v1/dashboard`)

#### 3.1 Get All Submissions (`GET /api/v1/dashboard/submissions`)
* **Access:** Protected -> `authGuard('MENTOR')`
* **Query Parameters:** `page` (default 1), `limit` (default 10), `status` (optional: APPROVED or REJECTED).
* **Service Logic:**
  1. Calculate `skip` = (page - 1) * limit.
  2. Build `where` object. If `status` is provided, add `{ status: req.query.status }`.
  3. Fetch submissions using `prisma.submission.findMany` including student details (select: name, email).
  4. Fetch total count using `prisma.submission.count` for pagination metadata.
* **Success Response:** 200 OK. Return data array and meta object (page, limit, total).

#### 3.2 Update Submission Status (`PATCH /api/v1/dashboard/submissions/:id/status`)
* **Access:** Protected -> `authGuard('MENTOR')`
* **Payload:** `status` (must be either "APPROVED" or "REJECTED"). validated via Zod.
* **Service Logic:**
  1. Check if submission exists. If not, throw 404 Error.
  2. Update submission status in DB using Prisma `update`.
* **Success Response:** 200 OK. Return updated submission data.

#### 3.3 Get Aggregated Statistics (`GET /api/v1/dashboard/stats`)
* **Access:** Protected -> `authGuard('MENTOR')`
* **Service Logic:**
  1. Run `prisma.submission.groupBy` grouping by `status` and `_count`.
  2. Format the result to return an object like: `{ totalPending: X, totalApproved: Y, totalRejected: Z }`.
* **Success Response:** 200 OK.

---

## 5. Standardized Response Format
Every successful API response follows this exact format:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Dynamic success message",
  "meta": { "page": 1, "limit": 10, "total": 50 },
  "data": { }
}
```

## 6. Global Error Handling Rules
```json
{
  "success": false,
  "message": "Error summary",
  "errorDetails": [ ... ],
  "stack": "..."
}
```
