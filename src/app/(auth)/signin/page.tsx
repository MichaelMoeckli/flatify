import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

export const metadata = { title: "Sign in · Flatify" };

async function doSignIn(formData: FormData) {
  "use server";
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) {
    redirect("/signin?error=1");
  }
  try {
    await signIn("credentials", { username, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/signin?error=1");
    }
    throw error;
  }
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="flex-1 grid place-items-center p-6">
      <form action={doSignIn} className="max-w-sm w-full space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Flatify</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Pick your username and type the shared password.
          </p>
        </div>
        <input
          name="username"
          type="text"
          inputMode="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="username"
          required
          placeholder="username"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-base"
        />
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Shared password"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-base"
        />
        {error ? (
          <p className="text-sm text-rose-500">
            Wrong username or password.
          </p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-lg bg-slate-900 dark:bg-slate-100 text-slate-50 dark:text-slate-900 px-3 py-2 font-medium"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
