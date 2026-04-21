"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const ITEMS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/expenses", label: "Feed", icon: "📋" },
  { href: "/expenses/new", label: "Add", icon: "➕" },
  { href: "/settle", label: "Settle", icon: "🤝" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/onboarding") return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-xl items-stretch justify-between">
        {ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors",
                active ? "text-brand-dark" : "text-neutral-500",
              )}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
