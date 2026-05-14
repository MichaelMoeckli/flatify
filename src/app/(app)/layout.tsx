import { BottomNav } from "@/components/BottomNav";
import { requireUser } from "@/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto">
      <main className="flex-1 pb-4">{children}</main>
      <BottomNav />
    </div>
  );
}
