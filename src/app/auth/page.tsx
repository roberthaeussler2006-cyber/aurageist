"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { usernameToEmail } from "@/lib/username";

export default function AuthPage() {
  const { signIn, user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    const display = user.user_metadata?.username ?? user.email;
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-2xl font-semibold mb-5">
            Signed in as <span className="text-gradient">{display}</span>
          </p>
          <Link href="/" className="btn-gradient inline-block px-6 py-3 text-xs uppercase">
            ← Back to voting
          </Link>
        </div>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_.-]{2,32}$/.test(cleanUsername)) {
      setError("username must be 2-32 chars, letters/numbers/._-");
      setSubmitting(false);
      return;
    }
    if (mode === "signup") {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername, password }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        setError(b?.error ?? "sign up failed");
        setSubmitting(false);
        return;
      }
    }
    const { error: err } = await signIn(usernameToEmail(cleanUsername), password);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    router.push("/");
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm bg-panel rounded-3xl p-8 shadow-[var(--shadow-lg)] border border-line">
        <h1 className="text-3xl font-bold text-center tracking-tight">
          {mode === "signin" ? "Welcome back" : (
            <>Get your <span className="text-gradient">aura</span></>
          )}
        </h1>
        <p className="text-center text-[11px] uppercase tracking-[0.18em] font-semibold text-muted mt-2 mb-7">
          {mode === "signin" ? "sign in to vote" : "track your personal ranking"}
        </p>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted">Username</span>
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-background border border-line rounded-xl px-4 py-3 text-foreground focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 transition-all"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted">Password</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background border border-line rounded-xl px-4 py-3 text-foreground focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 transition-all"
            />
          </label>
          {error && <p className="text-sm text-[#e11d48]">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="btn-gradient mt-2 px-4 py-3 text-xs uppercase disabled:opacity-50"
          >
            {submitting ? "..." : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
          className="mt-6 w-full text-center text-[11px] uppercase tracking-[0.18em] font-semibold text-muted hover:text-accent transition-colors"
        >
          {mode === "signin" ? "need an account? sign up" : "have an account? sign in"}
        </button>
      </div>
    </div>
  );
}
