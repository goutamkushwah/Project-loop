
export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto max-w-6xl px-6">

        <h1 className="mb-8 text-4xl font-bold text-slate-800">
          My Profile
        </h1>

        <div className="grid gap-8 lg:grid-cols-3">

          {/* Left Card */}

          <div className="rounded-2xl bg-white p-8 shadow-lg">

            <div className="flex flex-col items-center">

              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-blue-600 text-5xl font-bold text-white">
                G
              </div>

              <h2 className="mt-6 text-2xl font-bold">
                Goutam Kushwah
              </h2>

              <p className="text-slate-500">
                Viewer
              </p>

              <span className="mt-4 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                Active Member
              </span>

            </div>

            <div className="mt-10 space-y-4">

              <div>
                <p className="text-sm text-slate-500">
                  Email
                </p>

                <p className="font-semibold">
                  goutam@example.com
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Workspace
                </p>

                <p className="font-semibold">
                  LOOP Demo Workspace
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Member Since
                </p>

                <p className="font-semibold">
                  January 2026
                </p>
              </div>

            </div>

          </div>

          {/* Right */}

          <div className="space-y-8 lg:col-span-2">

            {/* Account */}

            <div className="rounded-2xl bg-white p-8 shadow-lg">

              <h2 className="mb-6 text-2xl font-bold">
                Account Information
              </h2>

              <div className="grid gap-6 md:grid-cols-2">

                <div>
                  <label className="text-sm text-slate-500">
                    Full Name
                  </label>

                  <input
                    readOnly
                    value="Goutam Kushwah"
                    className="mt-2 w-full rounded-lg border bg-slate-50 p-3"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-500">
                    Role
                  </label>

                  <input
                    readOnly
                    value="Viewer"
                    className="mt-2 w-full rounded-lg border bg-slate-50 p-3"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-500">
                    Email
                  </label>

                  <input
                    readOnly
                    value="goutam@example.com"
                    className="mt-2 w-full rounded-lg border bg-slate-50 p-3"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-500">
                    Workspace
                  </label>

                  <input
                    readOnly
                    value="LOOP Demo Workspace"
                    className="mt-2 w-full rounded-lg border bg-slate-50 p-3"
                  />
                </div>

              </div>

            </div>

            {/* Statistics */}

            <div className="rounded-2xl bg-white p-8 shadow-lg">

              <h2 className="mb-6 text-2xl font-bold">
                Activity
              </h2>

              <div className="grid gap-6 md:grid-cols-3">

                <div className="rounded-xl bg-blue-50 p-6">
                  <p className="text-slate-500">
                    Feedback Viewed
                  </p>

                  <h3 className="mt-3 text-4xl font-bold text-blue-700">
                    154
                  </h3>
                </div>

                <div className="rounded-xl bg-green-50 p-6">
                  <p className="text-slate-500">
                    Positive Reviews
                  </p>

                  <h3 className="mt-3 text-4xl font-bold text-green-700">
                    98
                  </h3>
                </div>

                <div className="rounded-xl bg-red-50 p-6">
                  <p className="text-slate-500">
                    Negative Reviews
                  </p>

                  <h3 className="mt-3 text-4xl font-bold text-red-700">
                    23
                  </h3>
                </div>

              </div>

            </div>

          </div>

        </div>
      </div>
    </main>
  );
}