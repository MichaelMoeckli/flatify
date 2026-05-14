import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { ShoppingItemRow } from "./ShoppingItemRow";
import { AddItemForm } from "./AddItemForm";
import { ClearCheckedButton } from "./ClearCheckedButton";
import { getSuggestions } from "@/server/actions/shopping";

export const dynamic = "force-dynamic";

export default async function ShoppingPage() {
  const [open, checked, suggestions] = await Promise.all([
    prisma.shoppingItem.findMany({
      where: { checkedAt: null },
      orderBy: { createdAt: "desc" },
      include: { createdBy: true },
    }),
    prisma.shoppingItem.findMany({
      where: { checkedAt: { not: null } },
      orderBy: { checkedAt: "desc" },
      take: 20,
      include: { createdBy: true, checkedBy: true },
    }),
    getSuggestions(),
  ]);

  return (
    <>
      <PageHeader
        title="Shopping"
        subtitle={`${open.length} open · ${checked.length} checked`}
        action={checked.length > 0 ? <ClearCheckedButton /> : null}
      />
      <section className="px-4 space-y-4">
        <AddItemForm suggestions={suggestions} />

        <div className="space-y-2">
          {open.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">Nothing to buy. Nice.</p>
          ) : (
            <ul className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
              {open.map((item) => (
                <ShoppingItemRow
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  qty={item.qty}
                  note={item.note}
                  checked={false}
                  byBadge={
                    <Avatar name={item.createdBy.name} color={item.createdBy.color} size="sm" />
                  }
                />
              ))}
            </ul>
          )}
        </div>

        {checked.length > 0 ? (
          <div className="space-y-2">
            <h2 className="px-1 text-xs uppercase tracking-wide text-slate-500">Recently checked</h2>
            <ul className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
              {checked.map((item) => (
                <ShoppingItemRow
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  qty={item.qty}
                  note={item.note}
                  checked
                  byBadge={
                    item.checkedBy ? (
                      <Avatar name={item.checkedBy.name} color={item.checkedBy.color} size="sm" />
                    ) : null
                  }
                />
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </>
  );
}
