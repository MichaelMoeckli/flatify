"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createChore } from "@/server/actions/chores";

type User = { id: string; name: string; color: string };

export function NewChoreForm({ users, myId }: { users: User[]; myId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-slate-300 dark:border-slate-700 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1.5"
      >
        <Plus size={16} /> New chore
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={(fd) =>
        start(async () => {
          await createChore(fd);
          ref.current?.reset();
          setOpen(false);
        })
      }
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-3"
    >
      <input
        name="name"
        required
        placeholder="Chore name (e.g. Take out trash)"
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs space-y-1">
          <span className="text-slate-500">Points</span>
          <input
            name="points"
            type="number"
            min={1}
            max={100}
            defaultValue={5}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs space-y-1">
          <span className="text-slate-500">Every (days)</span>
          <input
            name="cadenceDays"
            type="number"
            min={1}
            max={365}
            defaultValue={7}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      <label className="text-xs space-y-1 block">
        <span className="text-slate-500">First assignee</span>
        <select
          name="assigneeId"
          defaultValue={myId}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          name="rotates"
          type="checkbox"
          defaultChecked
          className="h-4 w-4 rounded border-slate-300"
        />
        <span>Rotate to flatmate after each completion</span>
      </label>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-slate-900 dark:bg-slate-100 text-slate-50 dark:text-slate-900 px-4 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </form>
  );
}
