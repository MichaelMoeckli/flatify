import { prisma } from "@/lib/db";
import { requireUser } from "@/auth";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { formatCents } from "@/lib/money";
import { getBothUsers, getPartner } from "@/lib/users";
import { computeBalance } from "@/server/balance";
import { NewExpenseForm } from "./NewExpenseForm";
import { ExpenseRow } from "./ExpenseRow";
import { SettleUpButton } from "./SettleUpButton";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const me = await requireUser();
  const partner = await getPartner(me.id);
  const users = await getBothUsers();

  const [expenses, settlements] = await Promise.all([
    prisma.expense.findMany({
      orderBy: { paidAt: "desc" },
      take: 50,
      include: { paidBy: true, shares: { include: { user: true } } },
    }),
    prisma.settlement.findMany({
      orderBy: { paidAt: "desc" },
      take: 20,
      include: { from: true, to: true },
    }),
  ]);

  const balance = partner ? await computeBalance(me.id, partner.id) : 0;

  const balanceLabel = !partner
    ? "Waiting for your flatmate to sign in."
    : balance === 0
      ? "You're all settled up."
      : balance > 0
        ? `${partner.name} owes you ${formatCents(balance)}`
        : `You owe ${partner.name} ${formatCents(-balance)}`;

  return (
    <>
      <PageHeader title="Expenses" subtitle="Shared costs" />
      <section className="px-4 space-y-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Balance</div>
          <div className="mt-1 text-lg font-medium">{balanceLabel}</div>
          {balance !== 0 && partner ? (
            <div className="mt-3">
              <SettleUpButton amountLabel={formatCents(Math.abs(balance))} />
            </div>
          ) : null}
        </div>

        <NewExpenseForm users={users} myId={me.id} />

        <div className="space-y-2">
          <h2 className="px-1 text-xs uppercase tracking-wide text-slate-500">Recent</h2>
          {expenses.length === 0 && settlements.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No expenses yet.</p>
          ) : (
            <ul className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
              {expenses.map((e) => (
                <ExpenseRow
                  key={e.id}
                  id={e.id}
                  description={e.description}
                  amountCents={e.amountCents}
                  paidAt={e.paidAt.toISOString()}
                  category={e.category}
                  paidBy={{
                    id: e.paidBy.id,
                    name: e.paidBy.name,
                    color: e.paidBy.color,
                  }}
                  shares={e.shares.map((s) => ({
                    userName: s.user.name,
                    amountCents: s.amountCents,
                  }))}
                  isMine={e.paidById === me.id}
                />
              ))}
              {settlements.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-3 py-3 bg-emerald-50/40 dark:bg-emerald-950/20">
                  <div className="h-8 w-8 shrink-0 grid place-items-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    €→
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      Settlement: {s.from.name} → {s.to.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(s.paidAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{formatCents(s.amountCents)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
