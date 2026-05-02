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
          <p className="serif text-2xl mb-4">signed in as {display}</p>
          <Link href="/" className="text-accent uppercase text-xs tracking-[0.25em]">
            ← back to voting
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
      <div className="w-full max-w-sm">
        <h1 className="serif text-4xl italic text-center mb-1">
          {mode === "signin" ? "sign in" : "create account"}
        </h1>
        <p className="text-center text-[10px] uppercase tracking-[0.3em] text-muted mb-8">
          track your personal aura ranking
        </p>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted">username</span>
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-panel/40 border border-line px-3 py-2 text-foreground focus:border-accent/60 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted">password</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-panel/40 border border-line px-3 py-2 text-foreground focus:border-accent/60 focus:outline-none"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 px-4 py-2 border border-accent/60 text-accent uppercase tracking-[0.25em] text-xs hover:bg-accent/10 disabled:opacity-40"
          >
            {submitting ? "..." : mode === "signin" ? "sign in" : "sign up"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
          className="mt-6 w-full text-center text-[10px] uppercase tracking-[0.25em] text-muted hover:text-accent"
        >
          {mode === "signin" ? "need an account? sign up" : "have an account? sign in"}
        </button>
      </div>
    </div>
  );
}
