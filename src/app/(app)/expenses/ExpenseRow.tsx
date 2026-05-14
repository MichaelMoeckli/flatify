"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { cn } from "@/lib/utils";
import { formatCents } from "@/lib/money";
import { deleteExpense } from "@/server/actions/expenses";

export function ExpenseRow({
  id,
  description,
  amountCents,
  paidAt,
  category,
  paidBy,
  shares,
  isMine,
}: {
  id: string;
  description: string;
  amountCents: number;
  paidAt: string;
  category: string | null;
  paidBy: { id: string; name: string; color: string };
  shares: { userName: string; amountCents: number }[];
  isMine: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <li className={cn("flex items-center gap-3 px-3 py-3", pending && "opacity-60")}>
      <Avatar name={paidBy.name} color={paidBy.color} size="md" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{description}</div>
        <div className="text-xs text-slate-500 flex flex-wrap gap-x-1.5">
          <span>{paidBy.name} paid</span>
          <span>· {new Date(paidAt).toLocaleDateString()}</span>
          {category ? <span>· {category}</span> : null}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">
          {shares
            .map((s) => `${s.userName}: ${formatCents(s.amountCents)}`)
            .join("  ·  ")}
        </div>
      </div>
      <div className="text-sm font-semibold">{formatCents(amountCents)}</div>
      {isMine ? (
        <button
          type="button"
          onClick={() => {
            if (confirm(`Delete "${description}"?`)) start(() => deleteExpense(id));
          }}
          aria-label={`Delete ${description}`}
          className="p-1.5 text-slate-400 hover:text-rose-500"
        >
          <Trash2 size={16} />
        </button>
      ) : null}
    </li>
  );
}
