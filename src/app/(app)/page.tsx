import Link from "next/link";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/PageHeader";
import { formatCents } from "@/lib/money";
import { computeBalance } from "@/server/balance";
import { getBothUsers, getPartner } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function Home() {
  const me = await requireUser();
  const partner = await getPartner(me.id);
  const users = await getBothUsers();

  const openShopping = await prisma.shoppingItem.count({ where: { checkedAt: null } });
  const overdueChores = await prisma.chore.count({ where: { nextDueAt: { lt: new Date() } } });
  const recentPosts = await prisma.pinboardPost.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 3,
    include: { author: true },
  });

  const balanceLine = partner
    ? await (async () => {
        const balance = await computeBalance(me.id, partner.id);
        if (balance === 0) return "All settled up.";
        if (balance > 0) return `${partner.name} owes you ${formatCents(balance)}.`;
        return `You owe ${partner.name} ${formatCents(-balance)}.`;
      })()
    : "Waiting for your flatmate to sign in.";

  return (
    <>
      <PageHeader title={`Hi, ${me.name}`} subtitle="What's going on at home" />
      <section className="px-4 space-y-3">
        <div className="flex items-center gap-2">
          {users.map((u) => (
            <Avatar key={u.id} name={u.name} color={u.color} size="md" />
          ))}
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {users.length === 2 ? "Both flatmates onboard" : "1 of 2 signed in"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/shopping"
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
          >
            <div className="text-xs uppercase tracking-wide text-slate-500">Shopping</div>
            <div className="mt-1 text-2xl font-semibold">{openShopping}</div>
            <div className="text-xs text-slate-500">open items</div>
          </Link>
          <Link
            href="/chores"
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
          >
            <div className="text-xs uppercase tracking-wide text-slate-500">Chores</div>
            <div className="mt-1 text-2xl font-semibold">{overdueChores}</div>
            <div className="text-xs text-slate-500">overdue</div>
          </Link>
          <Link
            href="/expenses"
            className="col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
          >
            <div className="text-xs uppercase tracking-wide text-slate-500">Balance</div>
            <div className="mt-1 text-lg font-medium">{balanceLine}</div>
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide text-slate-500">Pinboard</div>
            <Link href="/pinboard" className="text-xs text-indigo-600 dark:text-indigo-400">
              Open
            </Link>
          </div>
          {recentPosts.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No posts yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {recentPosts.map((p) => (
                <li key={p.id} className="flex gap-2">
                  <Avatar name={p.author.name} color={p.author.color} size="sm" />
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{p.author.name}: </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {p.body.length > 120 ? `${p.body.slice(0, 117)}…` : p.body}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="pt-2 text-center">
          <Link href="/settings" className="text-xs text-slate-500 underline">
            Settings
          </Link>
        </div>
      </section>
    </>
  );
}
