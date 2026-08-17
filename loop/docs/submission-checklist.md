# LOOP final submission checklist

The project brief requires every item below. Treat a missing artifact as a submission blocker.

## Required submission artifacts

- [ ] GitHub repository link is ready and accessible to the mentor/grader.
- [ ] Vercel production URL is ready and publicly accessible.
- [ ] Production database contains the verified final seeded workspace.
- [ ] README contains project overview, tech stack, local setup, environment variables, database/seed commands, architecture, screenshots, and one demo login for each role.
- [ ] Eight real production screenshots are committed and embedded in the README.
- [ ] Three-to-five-minute product demo video is recorded and uploaded using the cohort-approved sharing method.
- [ ] One-to-two-minute internship self-feedback video is recorded and uploaded.
- [ ] Cohort submission form is completed with all required links.

## Links to verify immediately before submitting

Do not rely on a browser session that is already authenticated. Open each submitted link in an incognito/private window and confirm:

- [ ] Repository link resolves or mentor access is granted.
- [ ] Production landing page loads.
- [ ] Admin demo login works.
- [ ] Analyst demo login works.
- [ ] Viewer demo login works.
- [ ] Product demo video is viewable with the sharing permissions used in the submission form.
- [ ] Self-feedback video is viewable with the sharing permissions used in the submission form.

## Final automated commands

Run from the repository root with production-equivalent configuration:

```bash
npm run db:migrate:deploy
npm run db:verify:seed
npm run final:qa
npm run smoke -- --base-url=$PRODUCTION_URL
npm run qa:submission