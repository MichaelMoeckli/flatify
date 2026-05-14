"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/auth";

const AddSchema = z.object({
  name: z.string().trim().min(1).max(120),
  qty: z.string().trim().max(40).optional(),
  note: z.string().trim().max(280).optional(),
});

export async function addShoppingItem(formData: FormData) {
  const me = await requireUser();
  const parsed = AddSchema.safeParse({
    name: formData.get("name") ?? "",
    qty: formData.get("qty") ?? undefined,
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  await prisma.shoppingItem.create({
    data: {
      name: parsed.data.name,
      qty: parsed.data.qty || null,
      note: parsed.data.note || null,
      createdById: me.id,
    },
  });
  revalidatePath("/shopping");
  revalidatePath("/");
  return { ok: true };
}

export async function toggleShoppingItem(id: string) {
  const me = await requireUser();
  const item = await prisma.shoppingItem.findUnique({ where: { id } });
  if (!item) return;
  await prisma.shoppingItem.update({
    where: { id },
    data: item.checkedAt
      ? { checkedAt: null, checkedById: null }
      : { checkedAt: new Date(), checkedById: me.id },
  });
  revalidatePath("/shopping");
  revalidatePath("/");
}

export async function deleteShoppingItem(id: string) {
  await requireUser();
  await prisma.shoppingItem.delete({ where: { id } });
  revalidatePath("/shopping");
  revalidatePath("/");
}

export async function clearCheckedItems() {
  await requireUser();
  await prisma.shoppingItem.deleteMany({ where: { checkedAt: { not: null } } });
  revalidatePath("/shopping");
  revalidatePath("/");
}

export async function getSuggestions(): Promise<string[]> {
  await requireUser();
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const rows = await prisma.shoppingItem.groupBy({
    by: ["name"],
    where: { createdAt: { gte: since } },
    _count: { name: true },
    orderBy: { _count: { name: "desc" } },
    take: 8,
  });
  // Exclude items currently open on the list.
  const open = new Set(
    (await prisma.shoppingItem.findMany({ where: { checkedAt: null }, select: { name: true } }))
      .map((i) => i.name.toLowerCase()),
  );
  return rows
    .map((r) => r.name)
    .filter((n) => !open.has(n.toLowerCase()))
    .slice(0, 5);
}
