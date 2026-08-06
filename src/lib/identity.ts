"use client";

import { useEffect, useState } from "react";

const KEY = "currentUserId";
const HOUSEHOLD_KEY = "currentHouseholdId";

function useStoredId(key: string): [string | null, (id: string | null) => void] {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      setId(stored);
    } catch {
      // ignore
    }
  }, [key]);

  const update = (v: string | null) => {
    setId(v);
    try {
      if (v) window.localStorage.setItem(key, v);
      else window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  };

  return [id, update];
}

export function useCurrentUserId(): [string | null, (id: string | null) => void] {
  return useStoredId(KEY);
}

export function useCurrentHouseholdId(): [string | null, (id: string | null) => void] {
  return useStoredId(HOUSEHOLD_KEY);
}

function readStoredId(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function readCurrentUserId(): string | null {
  return readStoredId(KEY);
}

export function readCurrentHouseholdId(): string | null {
  return readStoredId(HOUSEHOLD_KEY);
}

export function writeCurrentHouseholdId(id: string | null): void {
  try {
    if (id) window.localStorage.setItem(HOUSEHOLD_KEY, id);
    else window.localStorage.removeItem(HOUSEHOLD_KEY);
  } catch {
    // ignore
  }
}

export function writeCurrentUserId(id: string | null): void {
  try {
    if (id) window.localStorage.setItem(KEY, id);
    else window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
