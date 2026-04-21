"use client";

import { useEffect, useState } from "react";
import { useCurrentUserId } from "@/lib/identity";
import { api } from "@/lib/api-client";
import type { User } from "@/types";

export function IdentityPicker({ onReady }: { onReady?: (users: User[]) => void }) {
  const [currentId, setCurrentId] = useCurrentUserId();
  const [users, setUsers] = useState<User[] | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api
      .get<User[]>("/api/users")
      .then((u) => {
        setUsers(u);
        onReady?.(u);
      })
      .catch(() => setUsers([]))
      .finally(() => setReady(true));
  }, [onReady]);

  if (!ready || users === null) return null;

  // If no users exist yet, redirect users to onboarding via a hint; the page
  // that renders this component decides what to do with that info.
  if (users.length === 0) return null;

  // If the currentId is set and matches a known user, don't show the picker.
  if (currentId && users.some((u) => u.id === currentId)) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-sm p-6">
        <h2 className="mb-1 text-xl font-semibold">Who are you?</h2>
        <p className="mb-4 text-sm text-neutral-600">
          Pick your name. We&apos;ll remember on this device.
        </p>
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <button
              key={u.id}
              className="btn-secondary w-full justify-start text-base"
              onClick={() => setCurrentId(u.id)}
            >
              {u.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
