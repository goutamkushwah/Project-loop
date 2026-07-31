This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

# ✅ Week 1 Progress

Week 1 focused on building the foundation of the platform — authentication, workspace structure, and role-based access.

**Completed:**
- User authentication (login & signup) using NextAuth
- Role-Based Access Control — Administrator, Analyst, and Viewer roles
- Multi-tenant workspace setup with isolated data per company
- Team/member management — invite, list, and remove members
- Database schema design (Workspace, User, Feedback, Theme, Report models) using Prisma + PostgreSQL
- Initial feedback creation and listing (tenant-scoped)
- Home page UI update with feature highlights and role overview

**Next up (Week 2):**
- Feedback CRUD (create, edit, delete)
- CSV upload for bulk feedback
- AI sentiment analysis using Claude AI
- Analytics dashboard with charts