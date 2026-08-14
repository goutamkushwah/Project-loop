import TrendsClient from "@/components/trends/TrendsClient";
import { requireCurrentUser } from "@/lib/auth";

export default async function TrendsPage() {
  // Same pattern as your other protected pages — redirects to /login itself.
  await requireCurrentUser();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <TrendsClient />
    </div>
  );
}