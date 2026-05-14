import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/db";

const Body = z.object({ endpoint: z.string().url() });

export async function POST(req: Request) {
  const me = await requireUser();
  const { endpoint } = Body.parse(await req.json());
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: me.id } });
  return NextResponse.json({ ok: true });
}
