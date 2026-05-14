"use client";

import { useRef, useTransition } from "react";
import { createPost } from "@/server/actions/pinboard";

export function PostComposer() {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  return (
    <form
      ref={ref}
      action={(fd) =>
        start(async () => {
          await createPost(fd);
          ref.current?.reset();
        })
      }
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2"
    >
      <textarea
        name="body"
        required
        rows={3}
        placeholder="Write a note for your flatmate…"
        className="w-full resize-none bg-transparent text-base outline-none placeholder:text-slate-400"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-slate-900 dark:bg-slate-100 text-slate-50 dark:text-slate-900 px-4 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          Post
        </button>
      </div>
    </form>
  );
}
