"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { useAuth } from "@/components/AuthProvider";

type Comment = {
  id: string;
  user_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

const MAX_LEN = 1000;
const COMPACT_LIMIT = 5;

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await getBrowserSupabase()
      .from("comments")
      .select("id,user_id,author_name,body,created_at")
      .eq("figure_id", figureId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      setError(error.message);
      return;
    }
    setComments((data as Comment[]) ?? []);
  }, [figureId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const trimmed = body.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    const author_name = (user.email ?? "anon").split("@")[0];
    const { error } = await getBrowserSupabase().from("comments").insert({
      figure_id: figureId,
      user_id: user.id,
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
    <section className={compact ? "mt-4" : "mt-10 sm:mt-14"}>
      <h2 className={`text-[10px] uppercase tracking-[0.3em] text-muted ${compact ? "mb-2" : "mb-4"}`}>
        Comments {comments ? `(${comments.length})` : ""}
      </h2>

      {user ? (
        <form onSubmit={submit} className={`border border-line bg-panel/30 ${compact ? "p-2 mb-3" : "p-3 mb-6"}`}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_LEN))}
            placeholder="Share your take…"
            rows={compact ? 2 : 3}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted/60 focus:outline-none resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted/70">
              {body.length}/{MAX_LEN}
            </span>
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className="px-4 py-2 border border-accent/60 text-accent uppercase tracking-[0.25em] text-[10px] hover:bg-accent/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Posting…" : "Post"}
            </button>
          </div>
        </form>
      ) : (
        <div className="border border-line bg-panel/30 p-4 mb-6 text-sm text-foreground/70">
          <Link href="/auth" className="text-accent hover:underline">
            Sign in
          </Link>{" "}
          to leave a comment.
        </div>
      )}

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      {comments === null ? (
        <p className="text-foreground/60 text-sm">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="text-foreground/60 text-sm">No comments yet. Be the first.</p>
      ) : (
        <ul className={compact ? "space-y-2" : "space-y-3"}>
          {visible!.map((c) => (
            <li key={c.id} className="border border-line bg-panel/30 px-3 py-3">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted/80">
                <span className="text-accent/80">{c.author_name}</span>
                <span className="flex items-center gap-3">
                  <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  {user?.id === c.user_id && (
                    <button
                      onClick={() => remove(c.id)}
                      className="hover:text-red-400 transition-colors"
                      aria-label="Delete comment"
                    >
                      delete
                    </button>
                  )}
                </span>
              </div>
              <p className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap break-words">
                {c.body}
              </p>
            </li>
          ))}
          {hiddenCount > 0 && (
            <li className="text-[10px] uppercase tracking-[0.2em] text-muted/70 pt-1">
              + {hiddenCount} more on figure page
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
