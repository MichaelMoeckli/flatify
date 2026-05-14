import { prisma } from "@/lib/db";
import { requireUser } from "@/auth";
import { PageHeader } from "@/components/PageHeader";
import { PostComposer } from "./PostComposer";
import { PostCard } from "./PostCard";

export const dynamic = "force-dynamic";

export default async function PinboardPage() {
  const me = await requireUser();
  const posts = await prisma.pinboardPost.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { author: true },
  });

  return (
    <>
      <PageHeader title="Pinboard" subtitle="Notes between you two" />
      <section className="px-4 space-y-4">
        <PostComposer />
        {posts.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">No notes yet.</p>
        ) : (
          <ul className="space-y-3">
            {posts.map((p) => (
              <PostCard
                key={p.id}
                id={p.id}
                body={p.body}
                pinned={p.pinned}
                createdAt={p.createdAt.toISOString()}
                author={{ id: p.author.id, name: p.author.name, color: p.author.color }}
                isMine={p.author.id === me.id}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
