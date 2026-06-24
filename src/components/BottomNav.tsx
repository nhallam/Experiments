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

function matches(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/onboarding") return null;

  // Pick the longest matching href so /expenses/new wins over /expenses.
  const activeHref = ITEMS.reduce(
    (best, item) =>
      matches(item.href, pathname) && item.href.length > best.length
        ? item.href
        : best,
    "",
  );

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-40 mx-auto flex max-w-xl items-stretch justify-between rounded-2xl bg-neutral-900 shadow-lg">
      {ITEMS.map((item) => {
        const active = item.href === activeHref;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors",
              active ? "text-white" : "text-neutral-400 hover:text-neutral-200",
            )}
          >
            <Icon size={22} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
