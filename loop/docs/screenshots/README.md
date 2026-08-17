```markdown
# LOOP submission screenshot manifest

The internship brief requires real screenshots in the final repository README. Capture them from the deployed, seeded application rather than from mock data or design files.

Use the seeded `Acme Cloud` workspace and capture these views at desktop width after the production smoke test passes:

1. `01-login.png` — login page with no password entered.
2. `02-dashboard.png` — real dashboard with volume, sentiment, top themes, and Gemini intelligence metrics visible.
3. `03-inbox.png` — feedback inbox showing search/filter controls and classified feedback.
4. `04-themes.png` — theme catalog with real theme counts.
5. `05-trends.png` — theme trends chart and spike-detection comparison.
6. `06-ask-loop.png` — a grounded Ask LOOP answer with its cited feedback evidence visible.
7. `07-voc-report.png` — a saved Voice-of-Customer report showing summary, themes, verbatim evidence, and actions.
8. `08-admin-members.png` — Admin member-management page demonstrating the three-role workspace.
9. `report-1.png` — first report screenshot showing the Voice-of-Customer report with its summary, themes, verbatim evidence, and recommended actions.
10. `report-2.png` — second report screenshot showing the remaining report details, insights, evidence, or actions.

Before committing screenshots:

- Do not show API keys, environment variables, database URLs, browser devtools, or terminal secrets.
- Keep demo passwords out of the image itself; the README already lists the intentional demo credentials.
- Use the production deployment so screenshots reflect the submitted build.
- Make sure visible charts and AI answers come from the seeded database, not fabricated content.
- Prefer PNG files and keep each image reasonably compressed for GitHub rendering.

After the files exist, embed them in the root `README.md` under its **Screenshots** section using repository-relative paths such as `docs/screenshots/02-dashboard.png`.