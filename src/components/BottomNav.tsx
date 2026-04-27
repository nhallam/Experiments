"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  HomeIcon,
  ReceiptIcon,
  PlusIcon,
  HandshakeIcon,
  SettingsIcon,
} from "./icons";
import type { ComponentType, SVGProps } from "react";

type NavIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const ITEMS: { href: string; label: string; icon: NavIcon }[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/expenses", label: "Feed", icon: ReceiptIcon },
  { href: "/expenses/new", label: "Add", icon: PlusIcon },
  { href: "/settle", label: "Settle", icon: HandshakeIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
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
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors",
                active ? "text-brand-dark" : "text-neutral-500",
              )}
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
