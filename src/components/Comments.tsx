"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { useAuth } from "@/components/AuthProvider";

type Comment = {
  id: string;
  user_id: string | null;
  author_name: string;
  body: string;
  created_at: string;
};

const MAX_LEN = 1000;
const MAX_NAME_LEN = 40;
const COMPACT_LIMIT = 5;
const NAME_KEY = "aurageist-anon-name";

export function Comments({
  figureId,
  compact = false,
}: {
  figureId: string;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(NAME_KEY);
    if (saved) setName(saved);
  }, []);

  const load = useCallback(async () => {
    const { data, error } = await getBrowserSupabase()
      .from("comments")
      .select("id,user_id,author_name,body,created_at")
      .eq("figure_id", figureId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      setError(error.message);
      setComments([]);
      return;
    }
    setError(null);
    setComments((data as Comment[]) ?? []);
  }, [figureId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;

    let author_name: string;
    if (user) {
      author_name = (user.email ?? "anon").split("@")[0];
    } else {
      const trimmedName = name.trim();
      author_name = (trimmedName || "anon").slice(0, MAX_NAME_LEN);
      if (typeof window !== "undefined" && trimmedName) {
        window.localStorage.setItem(NAME_KEY, trimmedName);
      }
    }

    setSubmitting(true);
    setError(null);
    const { error } = await getBrowserSupabase().from("comments").insert({
      figure_id: figureId,
      user_id: user?.id ?? null,
      author_name,
      body: trimmed.slice(0, MAX_LEN),
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setBody("");
    void load();
  };

  const remove = async (id: string) => {
    const { error } = await getBrowserSupabase().from("comments").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setComments((prev) => (prev ? prev.filter((c) => c.id !== id) : prev));
  };

  const visible = compact && comments ? comments.slice(0, COMPACT_LIMIT) : comments;
  const hiddenCount = compact && comments ? Math.max(0, comments.length - COMPACT_LIMIT) : 0;

  return (
    <section className={compact ? "mt-5" : "mt-10 sm:mt-14"}>
      <h2 className={`text-[11px] uppercase tracking-[0.18em] font-semibold text-muted ${compact ? "mb-2" : "mb-4"}`}>
        Comments {comments && comments.length > 0 ? `· ${comments.length}` : ""}
      </h2>

      <form
        onSubmit={submit}
        className={`rounded-2xl bg-panel border border-line shadow-sm ${compact ? "p-3 mb-3" : "p-4 mb-5"}`}
      >
        {!user && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, MAX_NAME_LEN))}
            placeholder="Your name (optional)"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none border-b border-line pb-2 mb-2"
          />
        )}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_LEN))}
          placeholder="Share your take…"
          rows={compact ? 2 : 3}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted">
            {body.length}/{MAX_LEN}
          </span>
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="btn-gradient px-5 py-2 text-[11px] uppercase disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Posting…" : "Post"}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2 mb-3">
          {error.toLowerCase().includes("schema cache") || error.toLowerCase().includes("comments")
            ? "Comments table isn't set up yet — run supabase/schema.sql in the Supabase SQL editor."
            : error}
        </div>
      )}

      {comments === null ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : comments.length === 0 ? (
        !error && <p className="text-muted text-sm">No comments yet. Be the first.</p>
      ) : (
        <ul className={compact ? "space-y-2" : "space-y-3"}>
          {visible!.map((c) => (
            <li key={c.id} className="rounded-2xl bg-panel border border-line px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] font-semibold text-muted">
                <span className="text-gradient">{c.author_name}</span>
                <span className="flex items-center gap-3">
                  <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  {user && c.user_id && user.id === c.user_id && (
                    <button
                      onClick={() => remove(c.id)}
                      className="hover:text-rose-600 transition-colors"
                      aria-label="Delete comment"
                    >
                      delete
                    </button>
                  )}
                </span>
              </div>
              <p className="text-sm text-foreground mt-2 whitespace-pre-wrap break-words">
                {c.body}
              </p>
            </li>
          ))}
          {hiddenCount > 0 && (
            <li className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted pt-1">
              + {hiddenCount} more on figure page
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
