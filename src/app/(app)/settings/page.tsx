import { requireUser, signOut } from "@/auth";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { getBothUsers } from "@/lib/users";
import { EnablePushButton } from "./EnablePushButton";

export const dynamic = "force-dynamic";

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/signin" });
}

export default async function SettingsPage() {
  const me = await requireUser();
  const users = await getBothUsers();
  return (
    <>
      <PageHeader title="Settings" />
      <section className="px-4 space-y-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">Flatmates</div>
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3">
              <Avatar name={u.name} color={u.color} size="md" />
              <div className="text-sm">
                <div className="font-medium">
                  {u.name} {u.id === me.id ? <span className="text-slate-500">(you)</span> : null}
                </div>
                <div className="text-slate-500 text-xs">@{u.username}</div>
              </div>
            </div>
          ))}
          {users.length < 2 ? (
            <p className="text-xs text-slate-500">
              Your flatmate hasn&apos;t signed in yet. Share the URL and the shared password.
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">Notifications</div>
          <EnablePushButton />
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm"
          >
            Sign out
          </button>
        </form>
      </section>
    </>
  );
}
