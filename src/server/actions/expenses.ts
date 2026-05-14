"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/auth";
import { getPartner, getBothUsers } from "@/lib/users";
import { equalSplit, parseAmountToCents } from "@/lib/money";
import { computeBalance } from "@/server/balance";

const ExpenseSchema = z.object({
  description: z.string().trim().min(1).max(200),
  amount: z.string().trim().min(1),
  paidById: z.string().min(1),
  category: z.string().trim().max(40).optional(),
  splitMode: z.enum(["EQUAL", "CUSTOM"]).default("EQUAL"),
  shareSelf: z.string().optional(),
  shareOther: z.string().optional(),
});

export async function createExpense(formData: FormData) {
  const me = await requireUser();
  const parsed = ExpenseSchema.safeParse({
    description: formData.get("description") ?? "",
    amount: formData.get("amount") ?? "",
    paidById: formData.get("paidById") ?? me.id,
    category: formData.get("category") ?? undefined,
    splitMode: (formData.get("splitMode") as string) ?? "EQUAL",
    shareSelf: formData.get("shareSelf") ?? undefined,
    shareOther: formData.get("shareOther") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const totalCents = parseAmountToCents(parsed.data.amount);
  if (!totalCents || totalCents <= 0) return { ok: false, error: "Invalid amount" };

  const users = await getBothUsers();
  if (users.length < 2) return { ok: false, error: "Both flatmates must sign in first" };
  const payer = users.find((u) => u.id === parsed.data.paidById);
  const other = users.find((u) => u.id !== parsed.data.paidById);
  if (!payer || !other) return { ok: false, error: "Unknown payer" };

  let shares: { userId: string; amountCents: number }[];
  if (parsed.data.splitMode === "CUSTOM") {
    const selfCents = parseAmountToCents(parsed.data.shareSelf ?? "");
    const otherCents = parseAmountToCents(parsed.data.shareOther ?? "");
    if (selfCents === null || otherCents === null)
      return { ok: false, error: "Invalid share amounts" };
    if (selfCents + otherCents !== totalCents)
      return { ok: false, error: "Shares must sum to total" };
    shares = [
      { userId: payer.id, amountCents: selfCents },
      { userId: other.id, amountCents: otherCents },
    ];
  } else {
    shares = equalSplit(totalCents, payer.id, other.id);
  }

  await prisma.expense.create({
    data: {
      description: parsed.data.description,
      amountCents: totalCents,
      paidById: payer.id,
      category: parsed.data.category || null,
      splitMode: parsed.data.splitMode,
      shares: { create: shares },
    },
  });
  revalidatePath("/expenses");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteExpense(id: string) {
  const me = await requireUser();
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense || expense.paidById !== me.id) return;
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/expenses");
  revalidatePath("/");
}

export async function settleUp() {
  const me = await requireUser();
  const partner = await getPartner(me.id);
  if (!partner) return;
  const balance = await computeBalance(me.id, partner.id);
  if (balance === 0) return;
  // If balance > 0, partner owes me → record settlement from partner to me.
  // If balance < 0, I owe partner → settlement from me to partner.
  if (balance > 0) {
    await prisma.settlement.create({
      data: { fromUserId: partner.id, toUserId: me.id, amountCents: balance },
    });
  } else {
    await prisma.settlement.create({
      data: { fromUserId: me.id, toUserId: partner.id, amountCents: -balance },
    });
  }
  revalidatePath("/expenses");
  revalidatePath("/");
}
