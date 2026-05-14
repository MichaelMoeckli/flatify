"use client";

import { useTransition } from "react";
import { settleUp } from "@/server/actions/expenses";

export function SettleUpButton({ amountLabel }: { amountLabel: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`Record a settlement of ${amountLabel}?`)) start(() => settleUp());
      }}
      className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 text-sm font-medium disabled:opacity-50"
    >
      Settle up ({amountLabel})
    </button>
  );
}
