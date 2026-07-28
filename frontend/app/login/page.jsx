"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { Card, FONTS, AuthTopBar, AuthField, LoopMark } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const nav = (path) => router.push(path);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 6;

  async function handleSubmit() {
    setTouched(true);
    if (!email && !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    if (!emailValid) {
      setError("Enter a valid email address.");
      return;
    }
    if (!passwordValid) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    setLoading(true);

    // signIn talks to our Credentials provider (app/api/auth/[...nextauth]).
    // redirect:false lets us handle success/failure ourselves.
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

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
                Welcome back
              </h2>
              <p className="text-sm mt-1" style={{ color: "#8B899C" }}>Log in to your LOOP workspace</p>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <AuthField
                  icon={Mail}
                  type="email"
                  placeholder="Work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  invalid={touched && !emailValid}
                />
                {touched && email && !emailValid && (
                  <p className="text-xs mt-1.5" style={{ color: "#FB7166" }}>Enter a valid email address.</p>
                )}
              </div>
              <div>
                <AuthField
                  icon={Lock}
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  invalid={touched && !passwordValid}
                />
                {touched && password && !passwordValid && (
                  <p className="text-xs mt-1.5" style={{ color: "#FB7166" }}>Password must be at least 6 characters.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <button className="text-xs font-medium" style={{ color: "#8B899C" }}>Forgot password?</button>
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
              {loading ? "Logging in..." : "Log in"}
            </button>

            <p className="text-center text-xs mt-5" style={{ color: "#8B899C" }}>
              Don't have a workspace?{" "}
              <button onClick={() => nav("/signup")} className="font-medium" style={{ color: "#B9AFFF" }}>
                Sign up
              </button>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
