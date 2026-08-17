# LOOP final QA checklist

Run this checklist against the exact production build that will be submitted. A failed required item should be fixed before submission rather than explained away in the demo.

## Automated preflight

- [ ] `npm install` completes successfully on Node.js 20 or newer.
- [ ] `npm run db:validate` passes.
- [ ] `npm run prisma:generate` passes.
- [ ] `npm run db:migrate:deploy` applies all committed migrations.
- [ ] `npm run db:seed:final` completes against the demo database.
- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run format:check` passes.
- [ ] `npm run build` passes.
- [ ] `npm run qa:repo` passes.
- [ ] `npm run smoke -- --base-url=$PRODUCTION_URL` passes.
- [ ] After real screenshots are committed and the working tree is clean, `npm run qa:submission` passes.

## M1 — Foundation

- [ ] Production URL loads publicly.
- [ ] Signup creates a workspace and Admin user.
- [ ] Admin login works.
- [ ] Analyst login works.
- [ ] Viewer login works.
- [ ] Logged-out users are redirected away from protected pages.
- [ ] Admin, Analyst, and Viewer permissions differ as documented.
- [ ] A guessed cross-workspace feedback, theme, member, or report identifier exposes no foreign data.

## M2 — Core application

- [ ] Manual feedback creation works for Admin and Analyst.
- [ ] CSV import validates rows and reports imported/failed totals.
- [ ] Simulated source ingestion creates realistic feedback.
- [ ] Viewer cannot mutate feedback.
- [ ] Inbox pagination is server-side.
- [ ] Full-text search works.
- [ ] Channel filter works.
- [ ] Sentiment filter works.
- [ ] Theme filter works.
- [ ] Status filter works.
- [ ] Date-range filter works.
- [ ] Status workflow enforces `NEW → REVIEWED → ACTIONED`.
- [ ] Dashboard uses real database values.
- [ ] Dashboard volume, sentiment, and top-theme charts respond to active filters.

## M3 — AI features

- [ ] Ingested feedback is classified with Gemini.
- [ ] AI output is validated before persistence.
- [ ] Sentiment, score, feature area, themes, confidence, and rationale are stored.
- [ ] Manual re-classification works for Admin and Analyst.
- [ ] Theme catalog shows real assignment counts.
- [ ] Theme drill-down displays supporting feedback.
- [ ] Trends compare equal-length periods.
- [ ] Spike Rule B is enforced: current count ≥3, increase ≥2, growth ≥50%.
- [ ] Feedback embeddings exist for the final seeded data.
- [ ] Ask LOOP retrieves semantically relevant feedback before answering.
- [ ] Ask LOOP displays specific cited feedback evidence.
- [ ] Ask LOOP refuses unsupported answers rather than inventing evidence.

## M4 — Production

- [ ] VoC report generation works from a chosen period.
- [ ] Report statistics are pre-computed from PostgreSQL before Gemini narrative generation.
- [ ] Report contains top themes.
- [ ] Report contains sentiment shifts.
- [ ] Report contains real verbatim evidence.
- [ ] Report contains evidence-backed recommended actions.
- [ ] Saved reports remain viewable without another Gemini call.
- [ ] Public report share link works.
- [ ] Rotating a share link invalidates the previous link.
- [ ] Revoking a share link invalidates public access.
- [ ] Loading states are present on major routes.
- [ ] Empty states are meaningful.
- [ ] Error states provide recovery actions.
- [ ] 403 and 404 experiences are safe and clear.
- [ ] Mobile navigation works.
- [ ] Keyboard focus indicators are visible.
- [ ] Skip-to-content works.
- [ ] Reduced-motion preference is respected.
- [ ] README setup instructions work from a clean checkout.

## Submission quality

- [ ] No `.env` file is committed.
- [ ] No database URL containing real credentials is committed.
- [ ] No Gemini API key is committed.
- [ ] No browser-exposed Gemini key exists.
- [ ] No `node_modules`, `.next`, coverage output, or local build cache is committed.
- [ ] Git history contains meaningful incremental commits.
- [ ] Final branch is merged into the branch submitted to the mentor/grader.
- [ ] All eight production screenshots exist and are embedded in the README.
- [ ] Screenshots contain no secrets or browser developer tools.
- [ ] Demo credentials in README match the production seeded database.
- [ ] Public repository or mentor access is confirmed.
- [ ] Final Vercel URL is accessible in a private/incognito browser session.

## Demo rehearsal

- [ ] Demo video can be completed in three to five minutes.
- [ ] The demo shows authentication and RBAC.
- [ ] The demo shows ingestion and inbox triage.
- [ ] The demo shows classification.
- [ ] The demo shows themes and trends.
- [ ] The demo shows grounded Ask LOOP evidence.
- [ ] The demo shows a saved VoC report.
- [ ] The demo shows report sharing.
- [ ] No feature is described as working unless it is visibly working in the submitted deployment.
- [ ] No secret, API key, database URL, or password is visible in the recording.