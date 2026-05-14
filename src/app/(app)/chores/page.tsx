import { prisma } from "@/lib/db";
import { requireUser } from "@/auth";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { getBothUsers } from "@/lib/users";
import { getPointsByUser } from "@/server/actions/chores";
import { ChoreRow } from "./ChoreRow";
import { NewChoreForm } from "./NewChoreForm";

export const dynamic = "force-dynamic";

export default async function ChoresPage() {
  const me = await requireUser();
  const [chores, users, { monthly, lifetime }] = await Promise.all([
    prisma.chore.findMany({
      orderBy: { nextDueAt: "asc" },
      include: { assignee: true },
    }),
    getBothUsers(),
    getPointsByUser(),
  ]);

  return (
    <>
      <PageHeader title="Chores" subtitle="Recurring tasks and points" />
      <section className="px-4 space-y-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
            Points this month
          </div>
          <div className="grid grid-cols-2 gap-3">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <Avatar name={u.name} color={u.color} size="lg" />
                <div>
                  <div className="text-sm font-medium">{u.name}</div>
                  <div className="text-2xl font-semibold leading-tight">
                    {monthly[u.id] ?? 0}
                  </div>
                  <div className="text-xs text-slate-500">
                    {lifetime[u.id] ?? 0} lifetime
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <NewChoreForm users={users} myId={me.id} />

        <div className="space-y-2">
          {chores.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No chores yet.</p>
          ) : (
            <ul className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
              {chores.map((c) => (
                <ChoreRow
                  key={c.id}
                  id={c.id}
                  name={c.name}
                  points={c.points}
                  cadenceDays={c.cadenceDays}
                  rotates={c.rotates}
                  nextDueAt={c.nextDueAt.toISOString()}
                  assignee={{
                    id: c.assignee.id,
                    name: c.assignee.name,
                    color: c.assignee.color,
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
