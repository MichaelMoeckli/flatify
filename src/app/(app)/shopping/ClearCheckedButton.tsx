"use client";

import { useTransition } from "react";
import { clearCheckedItems } from "@/server/actions/shopping";

export function ClearCheckedButton() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => clearCheckedItems())}
      className="rounded-full border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs disabled:opacity-50"
    >
      Clear checked
    </button>
  );
}
