import Link from "next/link";

export default function DemoDashboard() {
  const stats = [
    {
      title: "Total Feedback",
      value: "154",
      color: "text-blue-600",
    },
    {
      title: "Positive",
      value: "98",
      color: "text-green-600",
    },
    {
      title: "Negative",
      value: "23",
      color: "text-red-600",
    },
    {
      title: "Pending",
      value: "33",
      color: "text-yellow-500",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navbar */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <h1 className="text-2xl font-bold text-blue-700">
            LOOP Dashboard
          </h1>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold">
                Goutam Kushwah
              </p>

              <p className="text-sm text-gray-500">
                Viewer
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
              G
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-8">

        <h2 className="mb-8 text-4xl font-bold">
          Dashboard
        </h2>

        {/* Cards */}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-xl"
            >
              <p className="text-gray-500">
                {item.title}
              </p>

              <h3 className={`mt-4 text-4xl font-bold ${item.color}`}>
                {item.value}
              </h3>
            </div>
          ))}
        </div>

        {/* Charts */}

        <div className="mt-10 grid gap-6 lg:grid-cols-2">

          <div className="rounded-2xl bg-white p-6 shadow">
            <h3 className="mb-5 text-xl font-semibold">
              Feedback Trend
            </h3>

            <div className="flex h-72 items-center justify-center rounded-xl border-2 border-dashed">
              📈 Line Chart
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <h3 className="mb-5 text-xl font-semibold">
              Sentiment Breakdown
            </h3>

            <div className="flex h-72 items-center justify-center rounded-xl border-2 border-dashed">
              🥧 Pie Chart
            </div>
          </div>

        </div>

        {/* Table */}

        <div className="mt-10 rounded-2xl bg-white p-6 shadow">

          <h3 className="mb-6 text-xl font-semibold">
            Recent Feedback
          </h3>

          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3">Customer</th>
                <th className="pb-3">Feedback</th>
                <th className="pb-3">Sentiment</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>

            <tbody>

              <tr className="border-b">
                <td className="py-4">John</td>
                <td>Excellent dashboard</td>
                <td className="text-green-600">
                  Positive
                </td>
                <td>Reviewed</td>
              </tr>

              <tr className="border-b">
                <td className="py-4">Emma</td>
                <td>Loading is slow</td>
                <td className="text-red-600">
                  Negative
                </td>
                <td>Pending</td>
              </tr>

              <tr>
                <td className="py-4">Alex</td>
                <td>Add Dark Mode</td>
                <td className="text-yellow-500">
                  Neutral
                </td>
                <td>Open</td>
              </tr>

            </tbody>
          </table>

        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            Back Home
          </Link>
        </div>

      </main>
    </div>
  );
}