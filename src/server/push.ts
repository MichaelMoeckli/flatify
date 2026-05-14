import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/db";

export type PushPayload = { title: string; body: string; url?: string };

let vapidConfigured = false;
function configureVapid(): boolean {
  if (vapidConfigured) return true;
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export async function notifyFlatmate(senderUserId: string, payload: PushPayload) {
  if (!configureVapid()) return;
  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { not: senderUserId } },
  });
  if (subs.length === 0) return;
  const json = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          json,
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        }
      }
    }),
  );
}
