"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Building2 } from "lucide-react";
import { Card, FONTS, AuthTopBar, AuthField, LoopMark } from "@/components/ui";

export default function SignupPage() {
  const router = useRouter();
  const nav = (path) => router.push(path);

  const [name, setName] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 6;

  async function handleSubmit() {
    setTouched(true);
    if (!name.trim()) return setError("Enter your full name.");
    if (!workspace.trim()) return setError("Enter a workspace name.");
    if (!emailValid) return setError("Enter a valid email address.");
    if (!passwordValid) return setError("Password must be at least 6 characters.");

    setError("");
    setLoading(true);

    // 1. Create the account via our own API route.
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, workspace, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Something went wrong.");
      return;
    }

    // 2. Immediately log them in through NextAuth so they land in an authenticated session.
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="w-full min-h-screen" style={{ background: "#0A0A12" }}>
      <style>{FONTS}</style>
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <AuthTopBar nav={nav} />
        <div className="flex justify-center px-6 pt-8 pb-20">
          <Card className="w-full max-w-sm p-7">
            <div className="text-center mb-6">
              <LoopMark size={30} />
              <h2
                className="text-xl font-semibold mt-3"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F1F0F5" }}
              >
                Create your workspace
              </h2>
              <p className="text-sm mt-1" style={{ color: "#8B899C" }}>You'll be the admin — invite your team after.</p>
            </div>

            <div className="flex flex-col gap-3">
              <AuthField
                icon={User} type="text" placeholder="Full name" value={name}
                onChange={(e) => setName(e.target.value)} invalid={touched && !name.trim()}
              />
              <AuthField
                icon={Building2} type="text" placeholder="Workspace name" value={workspace}
                onChange={(e) => setWorkspace(e.target.value)} invalid={touched && !workspace.trim()}
              />
              <div>
                <AuthField
                  icon={Mail} type="email" placeholder="Work email" value={email}
                  onChange={(e) => setEmail(e.target.value)} invalid={touched && !emailValid}
                />
                {touched && email && !emailValid && (
                  <p className="text-xs mt-1.5" style={{ color: "#FB7166" }}>Enter a valid email address.</p>
                )}
              </div>
              <div>
                <AuthField
                  icon={Lock} type="password" placeholder="Password" value={password}
                  onChange={(e) => setPassword(e.target.value)} invalid={touched && !passwordValid}
                />
                {touched && password && !passwordValid && (
                  <p className="text-xs mt-1.5" style={{ color: "#FB7166" }}>Password must be at least 6 characters.</p>
                )}
              </div>
            </div>

            {touched && error && (
              <div
                className="mt-4 rounded-lg px-3 py-2.5 text-xs"
                style={{ background: "rgba(251,113,102,0.1)", border: "1px solid rgba(251,113,102,0.3)", color: "#FB7166" }}
              >
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-5 rounded-lg py-3 text-sm font-medium disabled:opacity-60"
              style={{ background: "#7C6FFF", color: "#0A0A12" }}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

            <p className="text-center text-xs mt-5" style={{ color: "#8B899C" }}>
              Already have a workspace?{" "}
              <button onClick={() => nav("/login")} className="font-medium" style={{ color: "#B9AFFF" }}>
                Log in
              </button>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
