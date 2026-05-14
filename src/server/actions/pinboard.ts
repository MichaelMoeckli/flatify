"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/auth";

const PostSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export async function createPost(formData: FormData) {
  const me = await requireUser();
  const parsed = PostSchema.safeParse({ body: formData.get("body") ?? "" });
  if (!parsed.success) return { ok: false, error: "Empty post" };
  await prisma.pinboardPost.create({
    data: { body: parsed.data.body, authorId: me.id },
  });
  revalidatePath("/pinboard");
  revalidatePath("/");
  return { ok: true };
}

export async function updatePost(id: string, body: string) {
  const me = await requireUser();
  const post = await prisma.pinboardPost.findUnique({ where: { id } });
  if (!post || post.authorId !== me.id) return;
  const trimmed = body.trim();
  if (!trimmed) return;
  await prisma.pinboardPost.update({
    where: { id },
    data: { body: trimmed.slice(0, 2000) },
  });
  revalidatePath("/pinboard");
}

export async function deletePost(id: string) {
  const me = await requireUser();
  const post = await prisma.pinboardPost.findUnique({ where: { id } });
  if (!post || post.authorId !== me.id) return;
  await prisma.pinboardPost.delete({ where: { id } });
  revalidatePath("/pinboard");
  revalidatePath("/");
}

export async function togglePin(id: string) {
  await requireUser();
  const post = await prisma.pinboardPost.findUnique({ where: { id } });
  if (!post) return;
  await prisma.pinboardPost.update({
    where: { id },
    data: { pinned: !post.pinned },
  });
  revalidatePath("/pinboard");
  revalidatePath("/");
}
