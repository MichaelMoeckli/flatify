"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { addShoppingItem } from "@/server/actions/shopping";

export function AddItemForm({ suggestions }: { suggestions: string[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [expanded, setExpanded] = useState(false);

  const submit = (fd: FormData) =>
    start(async () => {
      await addShoppingItem(fd);
      formRef.current?.reset();
      setExpanded(false);
      inputRef.current?.focus();
    });

  return (
    <div className="space-y-2">
      <form ref={formRef} action={submit} className="space-y-2">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            name="name"
            required
            autoComplete="off"
            placeholder="Add to shopping list…"
            onFocus={() => setExpanded(true)}
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-base"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-slate-900 dark:bg-slate-100 text-slate-50 dark:text-slate-900 px-3 py-2 grid place-items-center disabled:opacity-50"
            aria-label="Add item"
          >
            <Plus size={20} />
          </button>
        </div>
        {expanded ? (
          <div className="flex gap-2 px-1">
            <input
              name="qty"
              placeholder="qty (e.g. 2× 1L)"
              className="w-36 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
            />
            <input
              name="note"
              placeholder="note"
              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
            />
          </div>
        ) : null}
      </form>
      {suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                const fd = new FormData();
                fd.set("name", s);
                submit(fd);
              }}
              className="rounded-full border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              + {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
