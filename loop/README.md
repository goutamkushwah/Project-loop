# LOOP — AI Customer-Feedback Intelligence Platform

LOOP is a multi-tenant SaaS application for collecting customer feedback, triaging it, analysing sentiment and themes, detecting trend spikes, asking grounded natural-language questions, and generating shareable Voice-of-Customer reports.

The application is built as a production-style Next.js 14 project with strict workspace isolation and server-side RBAC. AI features use Google Gemini; model responses are structured, validated, persisted, and grounded in workspace data rather than recomputed on page render.

## Core features

- Multi-tenant workspaces with `ADMIN`, `ANALYST`, and `VIEWER` roles.
- Credentials authentication with protected routes and server-side authorization.
- Manual feedback entry, CSV bulk import, and simulated feedback channels.
- Paginated inbox with full-text search, compound filters, and `NEW → REVIEWED → ACTIONED` workflow.
- Gemini classification for sentiment, sentiment score, feature area, themes, and rationale.
- Theme catalog, evidence drill-down, volume trends, and previous-period spike detection.
- Ask LOOP with Gemini embeddings, PostgreSQL `pgvector` semantic retrieval, grounded answers, and verifiable citations.
- Voice-of-Customer reports built from pre-computed database statistics and Gemini narrative generation.
- Secure public report sharing with opaque capability tokens whose raw values are never stored.
- Recharts dashboard backed by real persisted feedback, classification, sentiment, and theme data.
- Responsive loading, empty, error, 403, 404, keyboard-navigation, and reduced-motion states.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| UI | React 18 + Tailwind CSS |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Authentication | NextAuth.js 4 Credentials provider |
| Validation | Zod |
| AI | Google Gemini via `@google/genai` |
| Embeddings | `gemini-embedding-2`, 768 dimensions |
| Vector search | PostgreSQL `pgvector` + cosine HNSW index |
| Charts | Recharts |
| Deployment | Vercel |

## Architecture

```text
Browser
  │
  ├── Server-rendered Next.js App Router pages
  │
  └── /api/* Route Handlers
          │
          ├── Authentication + database-backed RBAC
          ├── Zod input validation
          ├── Workspace-scoped service layer
          │      │
          │      ├── Prisma ─────────────── PostgreSQL
          │      │                            ├── users/workspaces
          │      │                            ├── feedback/themes
          │      │                            ├── reports
          │      │                            └── pgvector embeddings
          │      │
          │      └── Gemini server services
          │             ├── classification
          │             ├── embeddings
          │             ├── grounded Ask LOOP
          │             └── VoC narrative
          │
          └── Typed API responses

The browser never supplies an authoritative workspaceId. Protected API routes resolve the authenticated database user and scope feedback, theme, embedding, report, and member operations to that user's workspace.

AI data flow

Feedback ingestion
    │
    ├── Gemini structured classification
    │       └── Zod validation → persisted sentiment/themes
    │
    └── Gemini embedding
            └── vector(768) → pgvector

Ask LOOP question
    └── question embedding
            └── top-K same-workspace semantic retrieval
                    └── retrieved evidence only → Gemini
                            └── validated answer + cited feedback IDs

VoC report
    └── deterministic PostgreSQL statistics
            └── evidence + numbers → Gemini narrative
                    └── validated contentJson → saved Report

## RBAC

Capability

ADMIN

ANALYST

VIEWER

View dashboard/inbox/themes/trends

✅

✅

✅

Use Ask LOOP

✅

✅

✅

Read saved reports

✅

✅

✅

Create/manage feedback

✅

✅

❌

Classify/re-classify feedback

✅

✅

❌

Run theme clustering

✅

✅

❌

Generate VoC reports

✅

✅

❌

Share/revoke report links

✅

✅

❌

Manage workspace members/roles

✅

❌

❌

API authorization is always enforced on the server. UI visibility is only a convenience layer.

Prerequisites

Node.js 20 or newer.

npm.

Git.

PostgreSQL with the vector extension available. Neon or Supabase are suitable hosted choices.

A Google Gemini API key.

A Vercel account for production deployment.

## Local setup

1. Clone and install

Clone the submitted repository, then run:

cd loop
npm install

2. Configure environment variables

Copy .env.example to .env and replace the example values:

cp .env.example .env

On Windows PowerShell:

Copy-Item .env.example .env

Required variables:

DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="a-random-secret-with-at-least-32-characters"
GEMINI_API_KEY="your-google-gemini-api-key"

SEED_ADMIN_PASSWORD="LoopAdmin!2026"
SEED_ANALYST_PASSWORD="LoopAnalyst!2026"
SEED_VIEWER_PASSWORD="LoopViewer!2026"

Generate a NextAuth secret with a secure local command such as:

openssl rand -base64 32

Never commit .env, production credentials, database connection strings, or Gemini API keys.

3. Prepare PostgreSQL

Validate the schema, generate Prisma Client, and apply committed migrations:

npm run db:validate
npm run prisma:generate
npm run db:migrate:deploy

The migrations enable PostgreSQL extensions and constraints required by LOOP, including pgcrypto and vector, and prepare the 768-dimensional semantic-search index.

4. Load the final demo dataset

For the full demo-ready dataset:

npm run db:seed:final

That command performs:

base seed
  → Gemini classification backfill
  → Gemini embedding backfill
  → strict final-seed verification

The final verifier requires:

exactly one seeded demo workspace;

one active user for each role;

120 feedback items;

all feedback classifications completed;

100% embedding coverage;

100% theme-assignment coverage.

If you only need the raw database records without running Gemini calls:

npm run db:seed

5. Run the application

npm run dev

Open:

http://localhost:3000

## Demo credentials

The seeded demo workspace is Acme Cloud.

Role

Email

Default demo password

Admin

admin@loop.demo

LoopAdmin!2026

Analyst

analyst@loop.demo

LoopAnalyst!2026

Viewer

viewer@loop.demo

LoopViewer!2026

These credentials are intentionally for the disposable seeded demo workspace only. They can be overridden with the three SEED_*_PASSWORD environment variables and should never be reused for a real account.

Main routes

Route

Purpose

/dashboard

Feedback volume, sentiment, themes, and persisted AI metrics

/inbox

Search, filters, ingestion, classification, and triage

/themes

Theme catalog, counts, clustering, and evidence drill-down

/trends

Theme volume and previous-period spike detection

/ask

Grounded semantic Q&A over workspace feedback

/reports

Generate and browse Voice-of-Customer reports

/reports/:id

Saved report detail and sharing controls

/settings/members

Admin-only member and role management

/shared/reports/:token

Public read-only capability-token report page

/api/health

Database-backed production health check

Feedback ingestion

LOOP supports three required ingestion paths:

Manual single-entry feedback.

CSV import with row-level validation and imported/failed counts.

Simulated channel pulls that generate realistic feedback without requiring third-party integrations.

A CSV template is available at:

/public/templates/feedback-import-template.csv

Suggested columns:

content,channel,customer_label,created_at

Sentiment and themes are produced by the server-side Gemini classification pipeline rather than trusted from imported CSV data.

Quality checks

Run before opening a pull request or deploying:

npm run db:validate
npm run prisma:generate
npm run typecheck
npm run lint
npm run format:check
npm run build

AI connectivity can be verified separately:

npm run ai:verify

Final seed verification

After seeding or before production submission:

npm run db:verify:seed

A passing run confirms the demo workspace contains the complete classified and embedded dataset expected by the submission.

## Production deployment

1. Configure Vercel environment variables

Set these for the Production environment:

DATABASE_URL
NEXTAUTH_URL
NEXTAUTH_SECRET
GEMINI_API_KEY
SEED_ADMIN_PASSWORD
SEED_ANALYST_PASSWORD
SEED_VIEWER_PASSWORD

NEXTAUTH_URL must equal the final production origin, for example:

$PRODUCTION_URL

2. Apply migrations to the production database

Run with the production DATABASE_URL loaded in your shell:

npm run db:migrate:deploy

3. Load and verify the production demo data

npm run db:seed:final

This intentionally resets only the seeded workspace whose slug is acme-cloud; do not point the seed command at a database where that slug contains data you need to preserve.

4. Deploy

npx vercel --prod

5. Run the production smoke test

npm run smoke -- --base-url=$PRODUCTION_URL

The smoke test verifies:

public landing and login pages;

/api/health and database connectivity;

successful login for Admin, Analyst, and Viewer demo users;

dashboard access for every role;

feedback, dashboard analytics, themes, trends, and reports read APIs;

member-list access for Admin;

member-list HTTP 403 enforcement for Analyst and Viewer.

A non-zero exit code means the deployment should not be submitted yet.

## Screenshots

The project brief requires real screenshots from the submitted application. They must be captured from the final seeded production deployment rather than fabricated from mock data.

The exact capture manifest and safe-capture rules are documented in docs/screenshots/README.md.

For the submission repository, capture and commit:

![Login](docs/screenshots/01-login.png)

![Dashboard](docs/screenshots/02-dashboard.png)

![Inbox](docs/screenshots/03-inbox.png)

![Themes](docs/screenshots/04-themes.png)

![Trends](docs/screenshots/05-trends.png)

![Ask LOOP](docs/screenshots/06-ask-loop.png)

![VOC Report](docs/screenshots/07-voc-report.png)

![Admin Members](docs/screenshots/08-admin-members.png)

After capturing them, embed the real images in this section using repository-relative Markdown paths. Do not substitute mockups or generated screenshots for the deployed product.

## Security notes

Database operations involving tenant-owned data are scoped by authenticated workspaceId.

Role checks execute server-side and forbidden API operations return HTTP 403.

Passwords are stored as scrypt hashes rather than plaintext.

Gemini calls and API keys are server-only.

All mutable API inputs are validated with Zod.

Cross-site mutations are rejected by same-origin request checks.

Report share links use cryptographically random capability tokens; only SHA-256 hashes are stored.

Unknown or cross-workspace resource IDs resolve without disclosing another tenant's data.

.env*, build artifacts, local databases, and node_modules are excluded from Git.

Repository structure

loop/
├── app/
│   ├── (auth)/                  # Login, signup, invitations
│   ├── (app)/                   # Protected product pages
│   ├── api/                     # Next.js Route Handlers
│   └── shared/reports/          # Public capability-token reports
├── components/                  # Forms, charts, tables, product UI
├── docs/                        # Final QA, demo, submission, and screenshot runbooks
├── lib/                         # Auth, validation, Gemini, prompts, utilities
├── prisma/
│   ├── migrations/              # PostgreSQL schema history
│   ├── schema.prisma
│   ├── seed-data.ts
│   └── seed.ts
├── public/templates/            # CSV import template
├── scripts/                     # AI backfills, seed verification, smoke test, final QA
├── services/                    # Workspace-scoped business logic
└── types/                       # Shared TypeScript contracts

Useful commands

Command

Purpose

npm run dev

Start local Next.js development server

npm run build

Generate Prisma Client and create production build

npm run typecheck

TypeScript validation

npm run lint

ESLint

npm run format:check

Prettier verification

npm run db:migrate:deploy

Apply committed database migrations

npm run db:seed

Load raw 120-item demo dataset

npm run db:seed:final

Seed, classify, embed, and verify final demo data

npm run db:verify:seed

Verify final demo-data completeness

npm run ai:verify

Verify Gemini structured classification connectivity

npm run ai:backfill

Backfill feedback classification

npm run ai:backfill-embeddings

Backfill semantic embeddings

npm run smoke -- --base-url=...

Verify deployed production application

npm run qa:repo

Audit final repository structure, provider migration, docs, and secret hygiene

npm run final:qa

Run typecheck, lint, formatting, build, seed verification, and repository QA

npm run qa:submission

Strict submission audit requiring screenshots and a clean Git tree

Scope

LOOP intentionally does not implement billing/payments, native mobile applications, real-time WebSocket features, email/SMS delivery, or live third-party feedback integrations. Simulated channel ingestion is used for integration-style demonstrations.

## Final QA and demo

Day 20 adds a repository-level preflight plus the final recording and submission runbooks.

Run the source/repository audit at any time:

npm run qa:repo

Run the full environment-dependent final QA after the production-equivalent database is prepared:

npm run final:qa

After all eight real production screenshots are committed and the Git working tree is clean, run the strict submission audit:

npm run qa:submission

The strict audit intentionally fails when screenshots are missing or when uncommitted changes remain.

Final runbooks:

docs/final-qa-checklist.md — milestone-by-milestone product verification.

docs/demo-video-script.md — approximately 4 minute 30 second product demo sequence.

docs/submission-checklist.md — required repository, deployment, video, and cohort-form handoff.

docs/screenshots/README.md — exact real-production screenshot capture manifest.

## Submission checklist

Before submitting the project:

Production migrations have been applied.

npm run db:seed:final passes against the demo database.

npm run typecheck, npm run lint, npm run format:check, and npm run build pass.

npm run smoke -- --base-url=$PRODUCTION_URL passes.

All three demo credentials work on production.

Real production screenshots have been added to the README.

No .env, API keys, connection strings, or node_modules are committed.

The repository URL and Vercel URL are accessible to the grader.

The three-to-five-minute demo video follows the final runbook and shows every required feature working.

The separate one-to-two-minute self-feedback video is uploaded and accessible.

The official cohort submission form contains the final repository, production, and video links.

npm run qa:submission passes after screenshots are committed and the Git working tree is clean.

License / internship note

LOOP is an internship project implementation. Keep the repository and demo credentials aligned with your cohort's submission and mentor-access requirements