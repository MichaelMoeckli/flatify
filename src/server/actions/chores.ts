"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/auth";
import { getPartner } from "@/lib/users";

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  points: z.coerce.number().int().min(1).max(100),
  cadenceDays: z.coerce.number().int().min(1).max(365),
  assigneeId: z.string().min(1),
  rotates: z.coerce.boolean(),
});

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function createChore(formData: FormData) {
  await requireUser();
  const parsed = CreateSchema.safeParse({
    name: formData.get("name") ?? "",
    points: formData.get("points") ?? 5,
    cadenceDays: formData.get("cadenceDays") ?? 7,
    assigneeId: formData.get("assigneeId") ?? "",
    rotates: formData.get("rotates") === "on" || formData.get("rotates") === "true",
  });
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  await prisma.chore.create({
    data: {
      name: parsed.data.name,
      points: parsed.data.points,
      cadenceDays: parsed.data.cadenceDays,
      assigneeId: parsed.data.assigneeId,
      rotates: parsed.data.rotates,
      nextDueAt: addDays(new Date(), parsed.data.cadenceDays),
    },
  });
  revalidatePath("/chores");
  revalidatePath("/");
  return { ok: true };
}

export async function completeChore(id: string) {
  const me = await requireUser();
  const chore = await prisma.chore.findUnique({ where: { id } });
  if (!chore) return;

  const now = new Date();
  let nextAssigneeId = chore.assigneeId;
  if (chore.rotates) {
    const partner = await getPartner(chore.assigneeId);
    if (partner) nextAssigneeId = partner.id;
  }

  await prisma.$transaction([
    prisma.choreCompletion.create({
      data: {
        choreId: chore.id,
        doneById: me.id,
        doneAt: now,
        pointsAwarded: chore.points,
      },
    }),
    prisma.chore.update({
      where: { id: chore.id },
      data: {
        lastDoneAt: now,
        nextDueAt: addDays(now, chore.cadenceDays),
        assigneeId: nextAssigneeId,
      },
    }),
  ]);
  revalidatePath("/chores");
  revalidatePath("/");
}

export async function deleteChore(id: string) {
  await requireUser();
  await prisma.chore.delete({ where: { id } });
  revalidatePath("/chores");
  revalidatePath("/");
}

export async function getPointsByUser(): Promise<{
  monthly: Record<string, number>;
  lifetime: Record<string, number>;
}> {
  await requireUser();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [monthRows, lifetimeRows] = await Promise.all([
    prisma.choreCompletion.groupBy({
      by: ["doneById"],
      where: { doneAt: { gte: monthStart } },
      _sum: { pointsAwarded: true },
    }),
    prisma.choreCompletion.groupBy({
      by: ["doneById"],
      _sum: { pointsAwarded: true },
    }),
  ]);

  const monthly: Record<string, number> = {};
  const lifetime: Record<string, number> = {};
  for (const r of monthRows) monthly[r.doneById] = r._sum.pointsAwarded ?? 0;
  for (const r of lifetimeRows) lifetime[r.doneById] = r._sum.pointsAwarded ?? 0;
  return { monthly, lifetime };
}
