"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { useAuth } from "@/components/AuthProvider";

type Comment = {
  id: string;
  user_id: string | null;
  parent_id: string | null;
  author_name: string;
  body: string;
  created_at: string;
  upvotes: number;
};

const MAX_LEN = 1000;
const MAX_NAME_LEN = 40;
const COMPACT_LIMIT = 5;
const NAME_KEY = "aurageist-anon-name";
const UPVOTES_KEY = "aurageist-upvoted";

function getUpvotedSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(UPVOTES_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveUpvotedSet(s: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UPVOTES_KEY, JSON.stringify(Array.from(s)));
  } catch {
    // ignore quota errors
  }
}

export function Comments({
  figureId,
  compact = false,
}: {
  figureId: string;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<"top" | "newest">("top");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(NAME_KEY);
    if (saved) setName(saved);
    setUpvoted(getUpvotedSet());
  }, []);

  const upvote = useCallback(async (commentId: string) => {
    if (upvoted.has(commentId)) return;
    const next = new Set(upvoted);
    next.add(commentId);
    setUpvoted(next);
    saveUpvotedSet(next);
    setComments((prev) =>
      prev ? prev.map((c) => (c.id === commentId ? { ...c, upvotes: c.upvotes + 1 } : c)) : prev,
    );
    const { error } = await getBrowserSupabase().rpc("increment_comment_upvote", {
      p_comment_id: commentId,
    });
    if (error) {
      const rollback = new Set(next);
      rollback.delete(commentId);
      setUpvoted(rollback);
      saveUpvotedSet(rollback);
      setComments((prev) =>
        prev
          ? prev.map((c) => (c.id === commentId ? { ...c, upvotes: Math.max(0, c.upvotes - 1) } : c))
          : prev,
      );
    }
  }, [upvoted]);

  const load = useCallback(async () => {
    const { data, error } = await getBrowserSupabase()
      .from("comments")
      .select("id,user_id,parent_id,author_name,body,created_at,upvotes")
      .eq("figure_id", figureId)
      .order("created_at", { ascending: false })
      .limit(400);
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

  const post = async (text: string, parentId: string | null): Promise<string | null> => {
    const trimmed = text.trim();
    if (!trimmed) return "Empty comment";

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

    const { error } = await getBrowserSupabase().from("comments").insert({
      figure_id: figureId,
      user_id: user?.id ?? null,
      parent_id: parentId,
      author_name,
      body: trimmed.slice(0, MAX_LEN),
    });
    if (error) return error.message;
    void load();
    return null;
  };

  const remove = async (id: string) => {
    const { error } = await getBrowserSupabase().from("comments").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setComments((prev) => (prev ? prev.filter((c) => c.id !== id && c.parent_id !== id) : prev));
  };

  const roots = (comments ?? [])
    .filter((c) => !c.parent_id)
    .sort((a, b) =>
      sort === "newest"
        ? b.created_at.localeCompare(a.created_at)
        : b.upvotes - a.upvotes || b.created_at.localeCompare(a.created_at),
    );
  const repliesByParent = new Map<string, Comment[]>();
  for (const c of comments ?? []) {
    if (!c.parent_id) continue;
    const arr = repliesByParent.get(c.parent_id) ?? [];
    arr.push(c);
    repliesByParent.set(c.parent_id, arr);
  }
  for (const arr of repliesByParent.values()) {
    arr.sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  const visibleRoots = compact ? roots.slice(0, COMPACT_LIMIT) : roots;
  const hiddenCount = compact ? Math.max(0, roots.length - COMPACT_LIMIT) : 0;

  return (
    <section className={compact ? "mt-5" : "mt-10 sm:mt-14"}>
      <div className={`flex items-center justify-between ${compact ? "mb-2" : "mb-4"}`}>
        <h2 className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted">
          Comments {comments && comments.length > 0 ? `· ${comments.length}` : ""}
        </h2>
        {comments && comments.filter((c) => !c.parent_id).length > 1 && (
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-semibold">
            <button
              type="button"
              onClick={() => setSort("top")}
              className={`px-2 py-1 rounded-full transition-colors ${
                sort === "top" ? "bg-accent/10 text-accent" : "text-muted hover:text-accent"
              }`}
            >
              top
            </button>
            <button
              type="button"
              onClick={() => setSort("newest")}
              className={`px-2 py-1 rounded-full transition-colors ${
                sort === "newest" ? "bg-accent/10 text-accent" : "text-muted hover:text-accent"
              }`}
            >
              new
            </button>
          </div>
        )}
      </div>

      <CommentForm
        compact={compact}
        showName={!user}
        name={name}
        setName={setName}
        onSubmit={(text) => post(text, null)}
        placeholder="Share your take…"
        submitLabel="Post"
      />

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2 mb-3">
          {error.toLowerCase().includes("schema cache") || error.toLowerCase().includes("comments")
            ? "Comments table isn't set up yet — run supabase/schema.sql in the Supabase SQL editor."
            : error}
        </div>
      )}

      {comments === null ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : roots.length === 0 ? (
        !error && <p className="text-muted text-sm">No comments yet. Be the first.</p>
      ) : (
        <ul className={compact ? "space-y-2" : "space-y-3"}>
          {visibleRoots.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              replies={repliesByParent.get(c.id) ?? []}
              onReply={(text) => post(text, c.id)}
              onDelete={remove}
              onUpvote={upvote}
              hasUpvoted={upvoted.has(c.id)}
              currentUserId={user?.id ?? null}
              showNameField={!user}
              name={name}
              setName={setName}
            />
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

function CommentItem({
  comment,
  replies,
  onReply,
  onDelete,
  onUpvote,
  hasUpvoted,
  currentUserId,
  showNameField,
  name,
  setName,
}: {
  comment: Comment;
  replies: Comment[];
  onReply: (text: string) => Promise<string | null>;
  onDelete: (id: string) => void;
  onUpvote: (id: string) => void;
  hasUpvoted: boolean;
  currentUserId: string | null;
  showNameField: boolean;
  name: string;
  setName: (n: string) => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const isOwn = currentUserId !== null && comment.user_id === currentUserId;

  return (
    <li className="rounded-2xl bg-panel border border-line px-4 py-3 shadow-sm">
      <CommentBody comment={comment} isOwn={isOwn} onDelete={onDelete} />
      <div className="flex items-center gap-3 mt-2">
        <button
          type="button"
          onClick={() => onUpvote(comment.id)}
          disabled={hasUpvoted}
          aria-pressed={hasUpvoted}
          className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-semibold transition-colors ${
            hasUpvoted ? "text-accent cursor-default" : "text-muted hover:text-accent"
          }`}
        >
          <span aria-hidden>{hasUpvoted ? "♥" : "♡"}</span>
          {comment.upvotes > 0 ? comment.upvotes : "like"}
        </button>
        <button
          type="button"
          onClick={() => setReplyOpen((v) => !v)}
          className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted hover:text-accent transition-colors"
        >
          {replyOpen ? "cancel" : "reply"}
        </button>
        {replies.length > 0 && (
          <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted">
            · {replies.length} {replies.length === 1 ? "reply" : "replies"}
          </span>
        )}
      </div>

      {replyOpen && (
        <div className="mt-3">
          <CommentForm
            compact
            showName={showNameField}
            name={name}
            setName={setName}
            onSubmit={async (text) => {
              const err = await onReply(text);
              if (!err) setReplyOpen(false);
              return err;
            }}
            placeholder={`Reply to ${comment.author_name}…`}
            submitLabel="Reply"
          />
        </div>
      )}

      {replies.length > 0 && (
        <ul className="mt-3 pl-4 border-l-2 border-line space-y-2">
          {replies.map((r) => {
            const replyOwn = currentUserId !== null && r.user_id === currentUserId;
            return (
              <li key={r.id} className="rounded-xl bg-white/60 border border-line/60 px-3 py-2">
                <CommentBody comment={r} isOwn={replyOwn} onDelete={onDelete} />
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

function CommentBody({
  comment,
  isOwn,
  onDelete,
}: {
  comment: Comment;
  isOwn: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] font-semibold text-muted">
        <span className="text-gradient">{comment.author_name}</span>
        <span className="flex items-center gap-3">
          <span>{new Date(comment.created_at).toLocaleDateString()}</span>
          {isOwn && (
            <button
              onClick={() => onDelete(comment.id)}
              className="hover:text-rose-600 transition-colors"
              aria-label="Delete comment"
            >
              delete
            </button>
          )}
        </span>
      </div>
      <p className="text-sm text-foreground mt-2 whitespace-pre-wrap break-words">
        {comment.body}
      </p>
    </>
  );
}

function CommentForm({
  compact,
  showName,
  name,
  setName,
  onSubmit,
  placeholder,
  submitLabel,
}: {
  compact: boolean;
  showName: boolean;
  name: string;
  setName: (n: string) => void;
  onSubmit: (text: string) => Promise<string | null>;
  placeholder: string;
  submitLabel: string;
}) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handle = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setLocalError(null);
    const err = await onSubmit(body);
    setSubmitting(false);
    if (err) {
      setLocalError(err);
      return;
    }
    setBody("");
  };

  return (
    <form
      onSubmit={handle}
      className={`rounded-2xl bg-panel border border-line shadow-sm ${compact ? "p-3 mb-3" : "p-4 mb-5"}`}
    >
      {showName && (
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
        placeholder={placeholder}
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
          {submitting ? "…" : submitLabel}
        </button>
      </div>
      {localError && (
        <p className="text-[11px] text-rose-600 mt-2">{localError}</p>
      )}
    </form>
  );
}
