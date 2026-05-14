"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createExpense } from "@/server/actions/expenses";

type User = { id: string; name: string; color: string };

const CATEGORIES = ["Groceries", "Rent", "Utilities", "Eating out", "Household", "Other"];

export function NewExpenseForm({ users, myId }: { users: User[]; myId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [splitMode, setSplitMode] = useState<"EQUAL" | "CUSTOM">("EQUAL");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-slate-300 dark:border-slate-700 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1.5"
      >
        <Plus size={16} /> New expense
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={(fd) =>
        start(async () => {
          setError(null);
          const result = await createExpense(fd);
          if (result?.ok) {
            ref.current?.reset();
            setOpen(false);
            setSplitMode("EQUAL");
          } else {
            setError(result?.error ?? "Could not save");
          }
        })
      }
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-3"
    >
      <input
        name="description"
        required
        placeholder="What was it? (e.g. Migros run)"
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs space-y-1">
          <span className="text-slate-500">Amount (CHF)</span>
          <input
            name="amount"
            required
            inputMode="decimal"
            placeholder="0.00"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs space-y-1">
          <span className="text-slate-500">Category</span>
          <select
            name="category"
            defaultValue=""
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
          >
            <option value="">—</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="text-xs space-y-1 block">
        <span className="text-slate-500">Paid by</span>
        <select
          name="paidById"
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
      <div className="text-xs space-y-1">
        <span className="text-slate-500">Split</span>
        <div className="flex gap-2">
          {(["EQUAL", "CUSTOM"] as const).map((mode) => (
            <label
              key={mode}
              className={`flex-1 rounded-lg border px-2 py-1.5 text-center text-sm cursor-pointer ${
                splitMode === mode
                  ? "border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-slate-50 dark:text-slate-900"
                  : "border-slate-300 dark:border-slate-700"
              }`}
            >
              <input
                type="radio"
                name="splitMode"
                value={mode}
                checked={splitMode === mode}
                onChange={() => setSplitMode(mode)}
                className="sr-only"
              />
              {mode === "EQUAL" ? "50 / 50" : "Custom"}
            </label>
          ))}
        </div>
      </div>
      {splitMode === "CUSTOM" ? (
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs space-y-1">
            <span className="text-slate-500">Payer share (CHF)</span>
            <input
              name="shareSelf"
              inputMode="decimal"
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs space-y-1">
            <span className="text-slate-500">Other share (CHF)</span>
            <input
              name="shareOther"
              inputMode="decimal"
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
            />
          </label>
        </div>
      ) : null}
      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
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
          Save
        </button>
      </div>
    </form>
  );
}
