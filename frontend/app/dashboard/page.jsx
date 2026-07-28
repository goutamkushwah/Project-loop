import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardApp } from "./DashboardApp";

// This runs on the server, before any HTML is sent.
// middleware.js already redirects unauthenticated requests, but this
// second check keeps the page safe even if middleware is ever removed
// or misconfigured (defense in depth).
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <DashboardApp session={session} />;
}
