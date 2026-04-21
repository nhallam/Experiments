"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "installHintDismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari legacy
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
}

export function InstallHint() {
  const [dismissed, setDismissed] = useState(true);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      // ignore
    }
    setDismissed(false);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // Chrome fires beforeinstallprompt; iOS never does. Show a manual hint there.
    if (isIOS()) setShowIOSHint(true);

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const result = await installEvent.userChoice;
    if (result.outcome === "accepted") dismiss();
    setInstallEvent(null);
  };

  if (dismissed) return null;
  if (!installEvent && !showIOSHint) return null;

  return (
    <div className="fixed inset-x-3 bottom-24 z-40 mx-auto max-w-md rounded-xl border border-neutral-200 bg-white p-4 shadow-lg">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" className="h-10 w-10 shrink-0 rounded-lg" />
        <div className="flex-1 text-sm">
          <p className="font-medium">Install Splitty</p>
          {installEvent ? (
            <p className="text-neutral-600">Add to your home screen for one-tap access.</p>
          ) : (
            <p className="text-neutral-600">
              Tap the Share button, then <strong>Add to Home Screen</strong>.
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        {installEvent && (
          <button className="btn-primary flex-1" onClick={install}>
            Install
          </button>
        )}
        <button
          className={installEvent ? "btn-ghost" : "btn-secondary flex-1"}
          onClick={dismiss}
        >
          {installEvent ? "Not now" : "Got it"}
        </button>
      </div>
    </div>
  );
}
