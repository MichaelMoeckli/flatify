"use client";

import { useTransition } from "react";
import { Check, Trash2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { cn } from "@/lib/utils";
import { completeChore, deleteChore } from "@/server/actions/chores";

function formatDue(iso: string) {
  const due = new Date(iso);
  const days = Math.round((due.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (days < 0) return { label: `${-days}d overdue`, overdue: true };
  if (days === 0) return { label: "due today", overdue: false };
  if (days === 1) return { label: "due tomorrow", overdue: false };
  return { label: `in ${days}d`, overdue: false };
}

export function ChoreRow({
  id,
  name,
  points,
  cadenceDays,
  rotates,
  nextDueAt,
  assignee,
}: {
  id: string;
  name: string;
  points: number;
  cadenceDays: number;
  rotates: boolean;
  nextDueAt: string;
  assignee: { id: string; name: string; color: string };
}) {
  const [pending, start] = useTransition();
  const due = formatDue(nextDueAt);
  return (
    <li className={cn("flex items-center gap-3 px-3 py-3", pending && "opacity-60")}>
      <button
        type="button"
        onClick={() => start(() => completeChore(id))}
        aria-label={`Mark ${name} done`}
        className="h-9 w-9 shrink-0 rounded-full border border-emerald-500 grid place-items-center text-emerald-500 hover:bg-emerald-500 hover:text-white"
      >
        <Check size={18} strokeWidth={3} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{name}</div>
        <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
          <span>{points} pts</span>
          <span>· every {cadenceDays}d</span>
          <span className={cn(due.overdue && "text-rose-500 font-medium")}>· {due.label}</span>
          {rotates ? <span>· rotates</span> : null}
        </div>
      </div>
      <Avatar name={assignee.name} color={assignee.color} size="sm" />
      <button
        type="button"
        onClick={() => {
          if (confirm(`Delete "${name}"?`)) start(() => deleteChore(id));
        }}
        aria-label={`Delete ${name}`}
        className="p-1.5 text-slate-400 hover:text-rose-500"
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}
