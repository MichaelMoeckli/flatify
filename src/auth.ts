import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import {
  displayNameFor,
  isUsernameAllowed,
  pickColorFor,
} from "@/lib/allowlist";

class InvalidCredentials extends CredentialsSignin {
  code = "invalid_credentials";
}

const CredsSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9_.-]+$/i, "Only letters, numbers, _ . -"),
  password: z.string().min(1).max(200),
});

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

// In-memory per-IP rate limit for the credentials provider. Lives in the
// serverless instance's memory, so each warm instance enforces its own counter
// and cold-start churn slightly weakens the bound. Adequate for the 2-user
// shared-password model; replace with Vercel KV / Upstash if the allowlist
// grows or per-user passwords are introduced.
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_FAILURES = 5;
const failureCounters = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: Request | undefined): string {
  if (!request) return "unknown";
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const entry = failureCounters.get(ip);
  if (!entry || entry.resetAt <= Date.now()) return false;
  return entry.count >= RATE_LIMIT_MAX_FAILURES;
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const entry = failureCounters.get(ip);
  if (!entry || entry.resetAt <= now) {
    failureCounters.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

function clearFailures(ip: string): void {
  failureCounters.delete(ip);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw, request) {
        const ip = getClientIp(request as Request | undefined);
        if (isRateLimited(ip)) throw new InvalidCredentials();

        try {
          const parsed = CredsSchema.safeParse(raw);
          if (!parsed.success) throw new InvalidCredentials();
          const { username, password } = parsed.data;

          const shared = process.env.AUTH_SHARED_PASSWORD;
          if (!shared) throw new InvalidCredentials();
          if (!isUsernameAllowed(username)) throw new InvalidCredentials();
          if (!safeEqual(password, shared)) throw new InvalidCredentials();

          // Lazy-import Prisma so this module stays edge-safe when imported by proxy.ts.
          const { prisma } = await import("@/lib/db");

          const user = await prisma.user.upsert({
            where: { username },
            update: {},
            create: {
              username,
              name: displayNameFor(username),
              color: pickColorFor(username),
            },
          });

          clearFailures(ip);

          return {
            id: user.id,
            name: user.name,
            username: user.username,
            color: user.color,
          };
        } catch (err) {
          if (err instanceof InvalidCredentials) recordFailure(ip);
          throw err;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id?: string; username?: string; color?: string };
        token.uid = u.id;
        token.username = u.username;
        token.color = u.color ?? "indigo";
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const s = session.user as {
          id?: string;
          username?: string;
          color?: string;
          name?: string | null;
        };
        s.id = (token.uid as string) ?? "";
        s.username = (token.username as string) ?? "";
        s.color = (token.color as string) ?? "indigo";
        s.name = (token.name as string) ?? s.name ?? null;
      }
      return session;
    },
  },
});

export type AppSessionUser = {
  id: string;
  name: string;
  username: string;
  color: string;
};

export async function requireUser(): Promise<AppSessionUser> {
  const session = await auth();
  const u = session?.user as Partial<AppSessionUser> | undefined;
  if (!u?.id || !u.username) {
    throw new Error("UNAUTHENTICATED");
  }
  return {
    id: u.id,
    username: u.username,
    name: u.name ?? u.username,
    color: u.color ?? "indigo",
  };
}
