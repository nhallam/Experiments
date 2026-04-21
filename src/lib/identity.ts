"use client";

import { useEffect, useState } from "react";

const KEY = "currentUserId";

export function useCurrentUserId(): [string | null, (id: string | null) => void] {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(KEY);
      setId(stored);
    } catch {
      // ignore
    }
  }, []);

  const update = (v: string | null) => {
    setId(v);
    try {
      if (v) window.localStorage.setItem(KEY, v);
      else window.localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  };

  return [id, update];
}

export function readCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
