# LOOP 3–5 minute final demo video script

This walkthrough is designed to fit in approximately **4 minutes 30 seconds** while showing the required product story end-to-end. Record the real deployed application with the final seeded database after the production smoke test passes.

## Before recording

- Use the final Vercel production deployment, not localhost.
- Run `npm run db:seed:final` against the demo database.
- Run `npm run smoke -- --base-url=$PRODUCTION_URL` and confirm it passes.
- Close browser developer tools and terminals containing credentials.
- Use the seeded `Acme Cloud` workspace.
- Keep the Admin, Analyst, and Viewer credentials ready, but do not display passwords on screen.
- Prepare one grounded Ask LOOP question, such as **“What are users saying about onboarding?”**
- Prepare one saved Voice-of-Customer report so report viewing and sharing can be shown without waiting for generation during the recording.

## 0:00–0:20 — Product introduction

**Show:** Public landing page, then login page.

**Say:**

> This is LOOP, an AI customer-feedback intelligence platform. It collects feedback from multiple sources, classifies it with Google Gemini, groups it into themes, identifies trends, supports grounded question answering, and generates Voice-of-Customer reports. The application is multi-tenant, so all customer data is isolated by workspace, and access is controlled through Admin, Analyst, and Viewer roles.

## 0:20–0:50 — Authentication, RBAC, and dashboard

**Show:** Log in as the seeded Admin and open the dashboard.

**Say:**

> I am logged into the seeded Acme Cloud workspace as an Admin. The dashboard uses real PostgreSQL data rather than simulated dashboard values. It shows feedback volume, sentiment, top themes, classification coverage, average stored sentiment score, and theme coverage. These metrics use persisted Gemini classifications; opening the dashboard does not make new AI calls.

Briefly change one dashboard filter and show the charts update.

## 0:50–1:30 — Feedback ingestion and inbox

**Show:** Inbox.

**Say:**

> LOOP supports manual feedback entry, CSV bulk import, and simulated channel ingestion. The inbox is server-paginated and supports full-text search plus channel, sentiment, theme, status, and date filters. Feedback follows the workflow New, Reviewed, then Actioned.

Show one classified feedback card and its sentiment/theme information. If practical, add one short feedback item or use a simulated source.

**Say:**

> New feedback is classified server-side with Gemini using structured JSON validated by Zod. The result is stored in the database, including sentiment, score, feature area, themes, confidence, and rationale. Admins and Analysts can also re-classify an item manually.

## 1:30–2:05 — Themes and trends

**Show:** Themes page, open one theme, then Trends.

**Say:**

> Similar feedback is grouped into workspace-scoped themes. Each theme shows a real assignment count, and opening it drills into the underlying feedback evidence. The Trends view compares the selected period with the immediately preceding equal-length period. LOOP flags a spike only when the current count is at least three, the absolute increase is at least two, and growth is at least fifty percent.

Show one evidence link from Trends back to filtered inbox feedback if a spike exists. If the seeded data has no active spike for the selected period, show the no-spike state instead of claiming one exists.

## 2:05–2:45 — Ask LOOP grounded Q&A

**Show:** Ask LOOP.

Ask:

> What are users saying about onboarding?

**Say:**

> Ask LOOP uses Gemini embeddings stored in PostgreSQL pgvector. The question is embedded, the most relevant feedback is retrieved from the authenticated workspace, and only that retrieved evidence is passed to Gemini. The final answer must cite feedback IDs that were actually retrieved, so the model cannot invent supporting customer feedback.

Show the answer and at least one cited evidence card.

## 2:45–3:30 — Voice-of-Customer report and sharing

**Show:** Reports list and a saved report.

**Say:**

> Voice-of-Customer reports are generated from real period data. LOOP calculates the feedback total, sentiment distribution and shifts, top themes, and representative evidence in application code first. Gemini writes the narrative around those facts, and all returned theme and feedback references are validated before the report is saved.

Show top themes, notable verbatim feedback, and recommended actions.

**Say:**

> Admins and Analysts can create a shareable read-only report link. The raw capability token is returned to the authorized user, while only its SHA-256 hash is stored. The link can be rotated or revoked at any time.

## 3:30–4:00 — Role enforcement

**Show:** Sign out and log in as Viewer, then open the product navigation.

**Say:**

> The Viewer role can read dashboards, feedback, themes, trends, Ask LOOP, and saved reports, but cannot create or modify feedback, run clustering, generate reports, share reports, or manage workspace members. These permissions are enforced in API routes on the server, not only by hiding buttons.

If time allows, show that the Members route is unavailable to Viewer.

## 4:00–4:30 — Architecture and close

**Show:** GitHub README architecture section or return to dashboard.

**Say:**

> LOOP is built with Next.js 14, TypeScript, PostgreSQL, Prisma, NextAuth, Tailwind, Recharts, Zod, pgvector, and Google Gemini. AI keys remain server-side, every tenant-owned database operation is scoped by the authenticated workspace, and the final deployment includes seeded accounts for all three roles. This completes the full feedback-to-insight workflow: ingest, classify, explore themes and trends, ask grounded questions, and generate a leadership-ready Voice-of-Customer report.

Stop the recording after the final product view. Keep the final video between three and five minutes.