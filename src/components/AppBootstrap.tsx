"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api-client";
import type { User } from "@/types";
import { IdentityPicker } from "./IdentityPicker";

/**
 * Ensures onboarding happens before the rest of the app.
 * - If no users exist and we're not on /onboarding, redirect there.
 * - Otherwise, render children + identity picker modal as needed.
 */
export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    api
      .get<User[]>("/api/users")
      .then((users) => {
        if (users.length === 0 && pathname !== "/onboarding") {
          router.replace("/onboarding");
        } else if (users.length > 0 && pathname === "/onboarding") {
          router.replace("/");
        }
      })
      .finally(() => setChecked(true));
  }, [pathname, router]);

  if (!checked) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-neutral-500">
        Loading…
      </div>
    );
  }

  return (
    <>
      {pathname !== "/onboarding" && <IdentityPicker />}
      {children}
    </>
  );
}
