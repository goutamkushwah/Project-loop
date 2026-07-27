const foundationItems = [
  "Next.js 14 App Router",
  "Strict TypeScript configuration",
  "Tailwind CSS",
  "Prisma ORM",
  "Hosted PostgreSQL",
  "Vercel-ready production build"
] as const;

export default function HomePage(): JSX.Element {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-5 py-16 sm:px-8 lg:px-12">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800">
              Zidio Internship Project
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Project - Loop
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              LOOP is an AI customer-feedback intelligence platform that will classify feedback,
              surface trends, answer grounded questions, and generate Voice-of-Customer reports.
            </p>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Day 1 establishes the production foundation: framework, TypeScript, styling,
              environment configuration, Prisma, PostgreSQL connectivity, and deployment readiness.
            </p>
          </div>

         
        </div>
        
      </section>
    </main>
  );
}
