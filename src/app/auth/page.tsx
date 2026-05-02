"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function AuthPage() {
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="serif text-2xl mb-4">signed in as {user.email}</p>
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
    setInfo(null);
    setSubmitting(true);
    const fn = mode === "signin" ? signIn : signUp;
    const { error: err } = await fn(email, password);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    if (mode === "signup") {
      setInfo("check your email to confirm, then sign in");
      setMode("signin");
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
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted">email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
          {info && <p className="text-sm text-accent">{info}</p>}
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
            setInfo(null);
          }}
          className="mt-6 w-full text-center text-[10px] uppercase tracking-[0.25em] text-muted hover:text-accent"
        >
          {mode === "signin" ? "need an account? sign up" : "have an account? sign in"}
        </button>
      </div>
    </div>
  );
}
