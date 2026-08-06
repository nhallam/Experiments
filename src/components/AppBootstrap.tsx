"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api-client";
import {
  readCurrentUserId,
  readCurrentHouseholdId,
  writeCurrentHouseholdId,
} from "@/lib/identity";
import type { Household } from "@/types";
import { IdentityPicker } from "./IdentityPicker";

const OPEN_PATHS = ["/onboarding", "/households"];

/**
 * Ensures a household is chosen before the rest of the app.
 * - No households at all → /onboarding to create the first one.
 * - No household chosen on this device → adopt the one the stored user
 *   belongs to (upgrade path for phones from the single-household era),
 *   otherwise → /households to pick.
 */
export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    api
      .get<Household[]>("/api/households")
      .then((households) => {
        const open = OPEN_PATHS.includes(pathname);
        if (households.length === 0) {
          if (pathname !== "/onboarding") router.replace("/onboarding");
          return;
        }
        const stored = readCurrentHouseholdId();
        if (stored && households.some((h) => h.id === stored)) return;

        const uid = readCurrentUserId();
        const mine = uid
          ? households.find((h) => h.users.some((u) => u.id === uid))
          : undefined;
        if (mine) {
          writeCurrentHouseholdId(mine.id);
          return;
        }
        if (!open) router.replace("/households");
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
      {!OPEN_PATHS.includes(pathname) && <IdentityPicker />}
      {children}
    </>
  );
}
