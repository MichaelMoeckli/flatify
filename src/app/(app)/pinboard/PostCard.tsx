"use client";

import { useState, useTransition } from "react";
import { Pin, PinOff, Pencil, Trash2, X, Check } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { cn } from "@/lib/utils";
import { deletePost, togglePin, updatePost } from "@/server/actions/pinboard";

function formatRelative(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return date.toLocaleDateString();
}

export function PostCard({
  id,
  body,
  pinned,
  createdAt,
  author,
  isMine,
}: {
  id: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  author: { id: string; name: string; color: string };
  isMine: boolean;
}) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(body);

  return (
    <li
      className={cn(
        "rounded-2xl border p-3",
        pinned
          ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40"
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
        pending && "opacity-60",
      )}
    >
      <header className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Avatar name={author.name} color={author.color} size="sm" />
          <div className="text-sm font-medium">{author.name}</div>
          <div className="text-xs text-slate-500">{formatRelative(createdAt)}</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => start(() => togglePin(id))}
            aria-label={pinned ? "Unpin" : "Pin"}
            className="p-1.5 text-slate-500 hover:text-amber-500"
          >
            {pinned ? <PinOff size={16} /> : <Pin size={16} />}
          </button>
          {isMine ? (
            <>
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                aria-label="Edit"
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              >
                {editing ? <X size={16} /> : <Pencil size={16} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete this post?")) start(() => deletePost(id));
                }}
                aria-label="Delete"
                className="p-1.5 text-slate-500 hover:text-rose-500"
              >
                <Trash2 size={16} />
              </button>
            </>
          ) : null}
        </div>
      </header>
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            disabled={pending || !draft.trim() || draft === body}
            onClick={() =>
              start(async () => {
                await updatePost(id, draft);
                setEditing(false);
              })
            }
            className="inline-flex items-center gap-1 rounded-full bg-slate-900 dark:bg-slate-100 text-slate-50 dark:text-slate-900 px-3 py-1 text-xs disabled:opacity-50"
          >
            <Check size={14} /> Save
          </button>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{body}</p>
      )}
    </li>
  );
}
