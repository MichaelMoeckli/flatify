"use client";

import { useTransition } from "react";
import { Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleShoppingItem, deleteShoppingItem } from "@/server/actions/shopping";

export function ShoppingItemRow({
  id,
  name,
  qty,
  note,
  checked,
  byBadge,
}: {
  id: string;
  name: string;
  qty: string | null;
  note: string | null;
  checked: boolean;
  byBadge: React.ReactNode;
}) {
  const [pending, start] = useTransition();
  return (
    <li
      className={cn(
        "flex items-center gap-3 px-3 py-2.5",
        pending && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={() => start(() => toggleShoppingItem(id))}
        aria-pressed={checked}
        aria-label={checked ? `Un-check ${name}` : `Check off ${name}`}
        className={cn(
          "h-7 w-7 shrink-0 rounded-full border grid place-items-center transition-colors",
          checked
            ? "bg-emerald-500 border-emerald-500 text-white"
            : "border-slate-300 dark:border-slate-700 text-transparent hover:border-slate-500",
        )}
      >
        <Check size={16} strokeWidth={3} />
      </button>
      <div className="flex-1 min-w-0">
        <div className={cn("text-sm", checked && "line-through text-slate-500")}>
          <span className="font-medium">{name}</span>
          {qty ? <span className="ml-2 text-slate-500">· {qty}</span> : null}
        </div>
        {note ? (
          <div className="text-xs text-slate-500 truncate">{note}</div>
        ) : null}
      </div>
      {byBadge}
      <button
        type="button"
        onClick={() => start(() => deleteShoppingItem(id))}
        aria-label={`Delete ${name}`}
        className="p-1.5 text-slate-400 hover:text-rose-500"
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}
