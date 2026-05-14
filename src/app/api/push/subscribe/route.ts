import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/db";

const Body = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

export async function POST(req: Request) {
  const me = await requireUser();
  const { endpoint, keys } = Body.parse(await req.json());
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: me.id },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: me.id },
  });
  return NextResponse.json({ ok: true });
}
