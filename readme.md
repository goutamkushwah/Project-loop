# 🚀 Project LOOP – AI Customer Feedback Intelligence Platform

**Close the loop on customer feedback.**

Project LOOP is a corporate-grade, AI-powered Customer Feedback Intelligence Platform built as part of the **Zidio Development Internship — Web Development Track**. It helps businesses collect, organize, analyze, and understand customer feedback from multiple sources in one centralized dashboard.

Instead of manually reading hundreds of customer reviews, support tickets, survey responses, and feedback comments, Project LOOP uses Artificial Intelligence (powered by the Anthropic Claude API) to automatically classify sentiment, cluster feedback into themes, detect emerging trends, answer plain-English questions grounded in real data, and generate boardroom-ready reports.

The platform is built as a secure **multi-tenant SaaS application**, meaning multiple organizations ("workspaces") can use the same platform independently while their data stays completely isolated from one another — the same architecture pattern used by real products like Enterpret, Dovetail, and Productboard Insights.

---

## 👥 Team

| Name | Email |
|---|---|
| Goutam Kushwah | goutam.kushwah2003@gmail.com |
| Sneha Sekar | snehasekar0123@gmail.com |
| Gaurav Athode | gauravathode123@gmail.com |
| Mohan Sahu | mohanmppsc@gmail.com |

---

## 📌 Table of Contents

1. [Overview](#-overview)
2. [Problem Statement](#-problem-statement)
3. [The Opportunity](#-the-opportunity)
4. [Objectives & Learning Outcomes](#-objectives--learning-outcomes)
5. [Project Scope](#-project-scope)
6. [Technology Stack](#-technology-stack)
7. [System Architecture](#-system-architecture)
8. [Data Model](#-data-model)
9. [Core Features](#-core-features)
10. [AI Features](#-ai-features)
11. [AI Implementation Approach](#-ai-implementation-approach)
12. [Project Timeline](#-project-timeline--4-week-sprint-plan)
13. [Milestones & Deliverables](#-milestones--deliverables)
14. [Getting Started](#-getting-started)
15. [Repository Structure](#-suggested-repository-structure)
16. [Security Notes](#-security--environment-variables)
17. [Demo Credentials](#-demo-credentials)
18. [Coding Standards & Git Workflow](#-coding-standards--git-workflow)
19. [Evaluation Rubric](#-evaluation--scoring-rubric)
20. [Glossary](#-glossary)

---

## 📖 Overview

Modern businesses receive customer feedback from many different channels, including:

- 🎫 Support tickets and live-chat transcripts
- ⭐ App-store and review-site ratings with written comments
- 📋 NPS and CSAT survey free-text responses
- 📞 Sales and customer-success call notes
- 💬 Social media mentions and community posts

Individually, each of these is just a sentence or two. Collectively, they hold the answer to the single most valuable question a company can ask: **"What should we build, fix, or improve next?"**

The problem is that no human team has the time to read, tag, and synthesize hundreds — or thousands — of feedback items every week. As a result, this feedback rots away in spreadsheets and inboxes, and important product decisions end up being made on gut feeling rather than actual evidence.

**Project LOOP solves this by becoming the single place a team drops all of its feedback — and letting AI do the reading.**

The platform automatically:

- 🏷️ Tags every incoming feedback item
- 🧩 Groups similar items into meaningful themes
- 📈 Flags what's trending or spiking this week
- 💬 Lets anyone ask questions in plain English and get answers grounded in the real data
- 📄 Generates ready-to-share Voice-of-Customer reports

With LOOP, teams move from *"we think customers want this"* to *"43 customers asked for this in the last 30 days, and complaints about it are up 60% week-over-week."*

---

## ❓ Problem Statement

Companies often receive thousands of feedback messages every month, arriving through many different doors at once. Reading every single message manually is:

- ⏳ **Time-consuming** — no team has the bandwidth to read everything
- ❌ **Error-prone** — manual tagging is inconsistent between reviewers
- 🗂️ **Difficult to organize** — feedback ends up scattered across tools and spreadsheets
- 📉 **Impossible to scale** — as feedback volume grows, manual review breaks down completely

As a result, valuable customer insight is routinely lost, duplicated effort is common, and product roadmaps get shaped by whoever shouts the loudest rather than by what the data actually shows.

**Project LOOP automates this entire process using AI — from ingestion to insight, without a human having to read every line.**

---

## 💡 The Opportunity

LOOP closes the gap between "feedback exists" and "feedback is acted on." It becomes the single place a team drops all of its raw feedback, while the AI layer handles the reading, tagging, grouping, and summarizing.

**Business framing:** Think of LOOP as something you're pitching to a Head of Product who has 90 seconds to listen. The headline is:

> "LOOP turns scattered customer feedback into a ranked, evidence-backed list of what to do next."

This is the sentence the entire product — and this README — is built around.

---

## 🎯 Objectives & Learning Outcomes

### Project Objectives

1. Design and ship a **multi-tenant web application** where each company's data is fully isolated from every other company's data.
2. Implement **secure authentication and role-based access control (RBAC)** across at least three roles — Admin, Analyst, and Viewer.
3. Build a **clean, predictable REST / Route-Handler API** consumed by the frontend, with no business logic leaking into UI components.
4. Integrate the **Claude AI API** to deliver at least three meaningful AI features that genuinely require AI — not cosmetic add-ons.
5. **Deploy** a production build to a public URL and document it so a stranger could run it locally.

### Learning Outcomes

| Skill Area | What It Proves |
|---|---|
| Data Modelling | Designing a relational schema with tenancy, relationships, and constraints (Prisma + PostgreSQL) |
| Backend / API | Writing typed, validated, paginated API endpoints with proper error handling and auth guards |
| Auth & Security | Session handling, RBAC, and preventing cross-tenant data access |
| AI Engineering | Prompt design for structured output, retrieval-grounded answers, and summarization |
| Frontend | Dashboards, data tables, filters, charts, loading/empty/error states, responsive layout |
| DevOps Basics | Environment configuration, database migrations, and deploying to Vercel |
| Professional Habits | Git hygiene, documentation, and presenting the work as a real product |

---

## 🧭 Project Scope

### ✅ In Scope (Required)

- Multi-tenant workspaces with **three roles**: Admin, Analyst, Viewer
- Feedback ingestion via **manual entry**, **CSV bulk upload**, and at least **one simulated channel source**
- A **feedback inbox** with search, filtering, pagination, and a status workflow
- An **analytics dashboard** with at least three charts driven by real data
- **Four AI features**: auto-classification, theme clustering & trends, Ask LOOP Q&A, and the Voice-of-Customer report
- A **public deployment**, a **README**, and a **demo video**

### 🚫 Out of Scope (Not to Be Built)

These are explicitly excluded — building them instead of the required scope lowers the score, not raises it:

- Real third-party integrations (live Zendesk / App Store / Twitter pulls) — simulated with seed data instead
- Billing, payments, or subscription tiers
- Native mobile apps
- Real-time collaboration (websockets / live cursors)
- Email/SMS delivery infrastructure

> **If you finish early:** Polish and harden the required scope first — tests, error states, accessibility, performance, and a genuinely impressive demo. Only after the required scope is excellent should a stretch feature be considered. A flawless core beats a half-working pile of extras.

---

## 🛠 Technology Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 14 (App Router) + TypeScript** | Full-stack in one codebase; matches production standards |
| Styling | **Tailwind CSS** | Fast, consistent, industry-standard utility CSS |
| Database | **PostgreSQL** (Neon or Supabase free tier) | Relational integrity for multi-tenant data |
| ORM | **Prisma** | Type-safe schema, migrations, and queries |
| Auth | **NextAuth (Auth.js)** | Sessions, providers, and role handling |
| AI | **Anthropic Claude API** | Classification, summarization, and Q&A |
| Embeddings / Search | **pgvector** or a hosted embeddings provider | Powers "Ask LOOP" semantic retrieval |
| Charts | **Recharts** | Dashboard visualizations |
| Validation | **Zod** | Runtime validation on every API boundary |
| Deployment | **Vercel + hosted Postgres** | One-command production deploys |

> **Approved alternative stack (Java Full-Stack track):** Spring Boot 3 + Java 17 + Spring Security + JPA/Hibernate + PostgreSQL for the backend, with a React (Vite) frontend, deployed via Render/Railway + Vercel. Every requirement and milestone applies identically — only the implementation technology changes.

---

## 🏗 System Architecture

LOOP follows a standard **three-tier architecture**. The browser only ever talks to LOOP's own API layer — the API layer is the sole component that talks to the database and to the Claude API.

### Request Flow

1. The **browser** (React Server/Client Components) renders the UI and calls the app's own API route handlers.
2. **Route handlers** authenticate the session, check the user's role, and scope every query to the caller's workspace.
3. **Prisma** reads/writes PostgreSQL. All feedback rows carry a `workspaceId`; every query filters on it.
4. For **AI features**, the route handler builds a prompt, calls the Claude API server-side, parses the response, and returns clean JSON to the browser.
5. For **Ask LOOP**, the handler first retrieves the most relevant feedback via vector search, then passes it to Claude as grounding context before answering.

> ⚠️ **Non-negotiable security rule:** Every single database query that touches feedback, themes, reports, or users **MUST** be filtered by the authenticated user's `workspaceId`. A user from Company A must never be able to read a row belonging to Company B — even by guessing an ID in the URL.

---

## 🗄 Data Model

Every tenant-owned table carries a `workspaceId` foreign key to enforce isolation.

| Entity | Key Fields & Relationships |
|---|---|
| **Workspace** | `id`, `name`, `createdAt` — has many Users, Feedback, Themes, Reports |
| **User** | `id`, `name`, `email`, `passwordHash`, `role` (ADMIN \| ANALYST \| VIEWER), `workspaceId` |
| **Feedback** | `id`, `content`, `channel`, `sourceRef`, `customerLabel`, `sentiment` (POS \| NEU \| NEG), `sentimentScore` (-1..1), `status` (NEW \| REVIEWED \| ACTIONED), `createdAt`, `workspaceId` |
| **Theme** | `id`, `name`, `description`, `color`, `workspaceId` — has many FeedbackTheme |
| **FeedbackTheme** | Join table — `feedbackId`, `themeId`, `confidence` (0..1) |
| **Embedding** | `id`, `feedbackId`, `vector` — powers Ask LOOP semantic search |
| **Report** | `id`, `title`, `periodStart`, `periodEnd`, `contentJson`, `createdAt`, `workspaceId`, `generatedBy` |

### Seed Data

A seed script is required that creates:

- One demo workspace
- Three users (one per role: Admin, Analyst, Viewer)
- At least **120 realistic feedback items** across several channels
- A handful of pre-defined themes

A demo with just a few rows of data looks unfinished — graders (and you) need real data to see the product actually work.

---

## 🧩 Core Features

### C1 — Authentication & Workspaces
As a new user, I can create an account and a workspace, then log in securely so my company's data stays private.

- Sign-up creates a User and a Workspace; the creator becomes ADMIN
- Passwords are hashed; sessions persist across refresh
- Logged-out users are redirected away from protected pages
- All visible data is scoped to the user's workspace only

### C2 — Role-Based Access Control
As an admin, I can invite teammates and assign roles so people only do what their role permits.

- Three roles: **ADMIN**, **ANALYST**, **VIEWER**
- Admins manage members and roles; Analysts ingest and manage feedback; Viewers are read-only
- Roles are enforced **server-side** — hiding a UI button is not enough
- Forbidden actions return a proper `403`, never a crash

### C3 — Feedback Ingestion
As an analyst, I can add feedback one item at a time, upload a CSV in bulk, or pull from a simulated channel.

- Single-entry form with validation (content required, channel selected)
- CSV upload parses rows and reports import success/failure counts
- At least one "channel" button seeds realistic items to simulate an integration
- Newly ingested items are automatically queued for AI classification

### C4 — Feedback Inbox
As an analyst, I can search, filter, and triage feedback so I can find and action what matters.

- Server-side pagination (never loading thousands of rows at once)
- Filter by channel, sentiment, theme, status, and date range
- Full-text search over feedback content
- Status workflow: **NEW → REVIEWED → ACTIONED**, changeable inline

### C5 — Analytics Dashboard
As a product manager, I can see the shape of our feedback at a glance so I know where to focus.

- At least three charts: volume over time, sentiment breakdown, top themes
- Charts reflect the active filters / date range
- Key stat cards: total items, % negative, new this week
- Graceful empty and loading states

---

## 🤖 AI Features

These four features are the heart of LOOP and carry the heaviest weight in grading. Each must work end-to-end against real seeded data during the demo.

### AI1 — Auto-Classification
Every piece of feedback is automatically tagged so no one has to triage by hand.

- On ingestion, each item is sent to Claude and returned with: sentiment, sentiment score, theme(s), and a short feature-area label
- Output is strictly structured **JSON**, validated before saving
- Classification is stored on the record — never recomputed on every page load
- A manual **"re-classify"** action exists for corrections

### AI2 — Theme Clustering & Trends
Product managers can see which themes are growing so they can react to emerging issues early.

- Similar feedback is grouped into named themes with counts
- A trends view shows theme volume over time and flags themes spiking vs. the previous period
- Clicking a theme drills into the underlying feedback items
- New feedback is assigned to existing themes where it fits, or forms a new one

### AI3 — Ask LOOP (Grounded Q&A)
Anyone on the team can ask plain-English questions and get answers backed by real feedback.

- A chat-style box accepts questions like *"What are users saying about onboarding?"*
- The system retrieves the most relevant feedback (semantic search) before answering
- Answers cite or list the specific feedback items they're based on
- The model must **never invent feedback** that isn't in the data — grounding is mandatory

### AI4 — Voice-of-Customer (VoC) Report
Product managers can generate a weekly digest they could forward to leadership without editing.

- One click generates a report for a chosen period
- The report summarizes top themes, sentiment shifts, notable verbatim quotes, and recommended actions
- Reports are saved, viewable later, and exportable (PDF or shareable page)
- Content is generated from the period's actual data — never generic filler

---

## 🧠 AI Implementation Approach

### Structured Classification (AI1)
Claude is asked to return **JSON only**, with a fixed schema, validated with Zod before saving:

- Feedback text plus the existing list of theme names is sent so the model reuses themes instead of inventing new ones each time
- The model returns: `sentiment`, `sentimentScore` (-1 to 1), `themes[]`, `featureArea`, and a one-line rationale
- Any stray markdown fences are stripped, the response is parsed and validated, with a graceful fallback (retry once, then flag for manual review) if parsing fails

### Retrieval-Grounded Q&A (AI3)
Ask LOOP answers strictly from the data using a **retrieve-then-answer** pattern:

1. Every feedback item is embedded on ingestion; the vector is stored (pgvector or a vectors table)
2. On a question, the question itself is embedded and the top-K most similar feedback items are retrieved
3. Those items are passed to Claude as context, with an explicit instruction: *answer only from the provided feedback; if the answer isn't present, say so*
4. The answer is returned along with the list of feedback items used, so the response can be verified

### Report Generation (AI4)
The period's stats (top themes, counts, sentiment deltas, a few representative quotes) are **pre-computed in code**, and Claude is asked to write the narrative around those numbers. This keeps the report accurate and cost-efficient, and prevents the model from hallucinating figures.

> **Cost, safety, and keys:** The Claude API key stays server-side only — never shipped to the browser or committed to Git. Classification runs on ingest and results are cached; the model is never called on every page render.

---

## 📅 Project Timeline — 4-Week Sprint Plan

The project runs across **four weeks (twenty working days)**. Each week is a sprint ending in a demoable deliverable and a mentor checkpoint.

### Week 1 — Foundation & Data Layer
*Deliverable: A deployed app where you can sign up, log in, and add & view feedback.*

| Day | Focus |
|---|---|
| 1 | Repo, Next.js + TypeScript + Tailwind setup, environment config, connect PostgreSQL, push "hello world" to Vercel |
| 2 | Design the Prisma schema, run first migration, write seed script skeleton |
| 3 | Authentication with NextAuth: sign-up, login, logout, protected routes, session handling |
| 4 | Workspaces + RBAC roles; ensure every query is scoped by `workspaceId`; member list for admins |
| 5 | Single-entry feedback create + list (no AI yet); deploy; mentor checkpoint |

### Week 2 — Core Application
*Deliverable: A working feedback-management app — bulk import, inbox with filters, dashboard shell.*

| Day | Focus |
|---|---|
| 6 | CSV bulk upload: parse, validate, import with success/failure summary |
| 7 | Simulated channel source(s) that seed realistic feedback |
| 8 | Feedback inbox: server-side pagination, search, status workflow |
| 9 | Inbox filters (channel, sentiment, theme, status, date range) wired to the API |
| 10 | Dashboard shell with Recharts: volume, sentiment, top-themes charts; deploy; checkpoint |

### Week 3 — AI Integration
*Deliverable: Auto-classification, theme trends, and Ask LOOP all working against real data.*

| Day | Focus |
|---|---|
| 11 | AI service wiring: server-side Claude call, structured-JSON classification, Zod validation |
| 12 | Classify on ingest + store results; back-fill classification across seeded data; manual re-classify |
| 13 | Theme clustering: assign feedback to themes; theme list with counts and drill-down |
| 14 | Trends view: theme volume over time + spike detection vs. previous period |
| 15 | Ask LOOP: embeddings on ingest, semantic retrieval, grounded answers with cited items; deploy; checkpoint |

### Week 4 — Intelligence & Production Polish
*Deliverable: A production-ready submission — VoC report, polished UX, README, and demo video.*

| Day | Focus |
|---|---|
| 16 | Voice-of-Customer report: pre-compute stats, generate narrative, save + view |
| 17 | Report export (PDF or shareable page); connect real AI-driven numbers into the dashboard |
| 18 | Hardening: error handling, loading/empty states, 403/404 pages, responsive pass, accessibility basics |
| 19 | Write the README (setup, architecture, screenshots); final seed data; final deploy + smoke test |
| 20 | Record the 3–5 minute demo video; final QA against the rubric; submit before the deadline |

> **Buffer & realism:** If a day is lost, protect the AI features (Week 3) and the deployment — those carry the most marks. Trim polish before trimming core functionality.

---

## 🏁 Milestones & Deliverables

| Milestone | End of | Deliverable | Points |
|---|---|---|---|
| **M1 — Foundation** | Week 1 | Live URL with auth, RBAC, workspaces, and basic feedback CRUD | 10 |
| **M2 — Core App** | Week 2 | Bulk import, inbox with filters & status, dashboard shell | 15 |
| **M3 — AI Features** | Week 3 | Classification, theme trends, and Ask LOOP working end-to-end | 15 |
| **M4 — Production** | Week 4 | VoC report, polished UX, README, demo video, final deploy | 10 |

### Optional Stretch Goals
Only attempt once the required scope is excellent:

- Saved views / segments in the inbox (e.g., "all negative onboarding feedback")
- A "suggested actions" queue turning recurring themes into draft tasks
- Sentiment trend alerts (banner when negativity spikes)
- Basic test coverage on the API layer (Vitest / Jest)

---

## ⚡ Getting Started

### Prerequisites

- Node.js 18 LTS or newer, and Git
- A free PostgreSQL database (Neon or Supabase)
- An Anthropic API key
- A Vercel account connected to GitHub

### First-Run Steps

```bash
# 1. Create the app and install dependencies
npx create-next-app@latest loop --typescript --tailwind --app
cd loop && npm install prisma @prisma/client next-auth zod recharts
npm install @anthropic-ai/sdk

# 2. Configure environment variables (never commit this file)
# .env -> DATABASE_URL, NEXTAUTH_SECRET, ANTHROPIC_API_KEY

# 3. Set up the database
npx prisma migrate dev --name init
npm run seed

# 4. Run locally, then deploy
npm run dev      # http://localhost:3000
vercel            # production deploy
```

---

## 📁 Suggested Repository Structure

```
loop/
  app/
    (auth)/login, signup
    (app)/dashboard, inbox, trends, ask, reports, settings
    api/
      auth/...        # NextAuth
      feedback/       # CRUD + ingestion
      themes/         # clustering + trends
      insights/       # Ask LOOP Q&A
      reports/        # VoC generation
  components/          # UI building blocks (charts, tables, forms)
  lib/
    ai.ts              # Claude calls: classify, answer, report
    search.ts          # embeddings + retrieval
    auth.ts            # session + role guards
    db.ts               # Prisma client
  prisma/
    schema.prisma
    seed.ts
  README.md
  .env.example          # documented, no real secrets
```

---

## 🔐 Security & Environment Variables

Keep the following in `.env` locally and in Vercel's project settings for production:

- `ANTHROPIC_API_KEY`
- `DATABASE_URL`
- `NEXTAUTH_SECRET`

`.env` is added to `.gitignore` from the very first commit. A leaked API key is treated as a security incident.

---

## 🔑 Demo Credentials

The README for the deployed submission lists one set of login credentials per role (Admin / Analyst / Viewer) on the seeded demo workspace, so anyone can verify RBAC without creating a new account. Demo passwords are never reused real-world passwords.

| Role | Email | Password |
|---|---|---|
| Admin | *(fill in)* | *(fill in)* |
| Analyst | *(fill in)* | *(fill in)* |
| Viewer | *(fill in)* | *(fill in)* |

---

## 🧑‍💻 Coding Standards & Git Workflow

### Code Quality

- TypeScript everywhere; `any` is avoided — types document the data
- Every API input is validated with Zod; client data is never trusted
- Business logic stays out of components — it lives in API routes / service files
- Errors are handled explicitly: friendly messages for users, detailed logs internally
- Consistent formatting (Prettier) and linting (ESLint)

### Git Workflow

- Commit early and often with meaningful messages (e.g., `feat: add CSV ingestion with row validation`)
- A branch per feature, merged into `main` via pull request — even solo
- Secrets, `.env` files, and `node_modules` are never committed
- The commit history tells the story of the four weeks — not one giant "final" commit at the end

---

## 📊 Evaluation & Scoring Rubric

The project is scored within a standard 100-point internship rubric.

| Component | Marks | Assessed By |
|---|---|---|
| Attendance | 20 | Program-level; daily presence and checkpoint participation |
| Test / Assessment | 10 | Program-level; track assessment |
| **Project** | **50** | Milestones M1–M4 |
| **Submission** | **20** | Deliverable quality |

### Project Breakdown (50 marks)

| Milestone | Marks | Full-Marks Bar |
|---|---|---|
| M1 Foundation | 10 | Secure auth, three working roles, true workspace isolation, live deployment that actually loads |
| M2 Core App | 15 | Bulk + single ingestion, fast paginated inbox with all filters, working status workflow, real dashboard |
| M3 AI Features | 15 | Classification, theme trends, and Ask LOOP working on real data, with grounded (non-hallucinated) answers |
| M4 Production | 10 | VoC report, polished states, responsive UI, clean README + demo |

### Submission Breakdown (20 marks)

| Criterion | Marks | Full-Marks Bar |
|---|---|---|
| Live deployment | 5 | A public URL that works, with seed data, that a grader can log into and explore |
| README & docs | 5 | Clear setup steps, architecture overview, and screenshots |
| Code quality & Git | 5 | Readable, typed, organized code; meaningful commits; no secrets committed |
| Demo video | 5 | A 3–5 minute walkthrough that tells the product story and shows every feature working |

### Quality Bar

- **Average submission:** Features technically present but rough — broken edge cases, ugly empty states, AI that sometimes invents data.
- **Top submission:** Feels like a real product — fast, isolated per tenant, AI answers grounded and useful, and the demo could be shown to a real customer.

---

## 📝 Submission Requirements

1. GitHub repository link (public, or private with mentor access)
2. Live deployment URL (Vercel) with working seed data and login credentials for each role
3. A `README.md` covering: what the project is, tech stack, local setup, environment variables, database/seed commands, architecture summary, and screenshots
4. A 3–5 minute demo video (unlisted YouTube / Google Drive link) walking through every feature
5. The completed submission form with all links pasted in
6. A 1–2 minute self-feedback video on the internship experience

---

## 📚 Glossary

| Term | Meaning |
|---|---|
| **Multi-tenant** | One application serving many isolated customers ("tenants"); each tenant's data is private |
| **RBAC** | Role-Based Access Control — permissions determined by a user's role |
| **Tenant Isolation** | Guaranteeing one customer can never read or write another customer's data |
| **Embedding** | A numeric vector representing text meaning, used for semantic similarity search |
| **RAG** | Retrieval-Augmented Generation — fetch relevant data first, then let the model answer from it |
| **Grounding** | Forcing the AI to answer only from provided data, not from memory or invention |
| **VoC** | Voice of Customer — the synthesized view of what customers are saying |
| **Seed Data** | Sample records loaded into the database so the app is usable and demoable immediately |

---

## 🔗 Resources

| Topic | Link |
|---|---|
| Next.js | https://nextjs.org/docs |
| Prisma | https://www.prisma.io/docs |
| NextAuth / Auth.js | https://authjs.dev |
| Anthropic Claude API | https://docs.claude.com |
| Recharts | https://recharts.org |
| Zod | https://zod.dev |
| Neon Postgres | https://neon.tech/docs |
| Vercel Deploys | https://vercel.com/docs |

---

<p align="center">
<strong>Zidio Development · Project LOOP · Web Development Track</strong><br>
<em>Build it like a product. Ship it like a professional.</em>
</p>