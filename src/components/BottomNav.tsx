"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, Sparkles, Wallet, PinIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/shopping", label: "Shopping", icon: ShoppingCart },
  { href: "/chores", label: "Chores", icon: Sparkles },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/pinboard", label: "Board", icon: PinIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="sticky bottom-0 z-30 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-slate-950/70 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs",
                  active
                    ? "text-slate-900 dark:text-slate-50"
                    : "text-slate-500 dark:text-slate-400",
                )}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.4 : 1.8}
                  aria-hidden
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
