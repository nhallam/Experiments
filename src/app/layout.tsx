import "./globals.css";
import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/BottomNav";
import { AppBootstrap } from "@/components/AppBootstrap";
import { InstallHint } from "@/components/InstallHint";

export const metadata: Metadata = {
  title: "Splitty",
  description: "Shared expense tracker for the house",
  applicationName: "Splitty",
  appleWebApp: {
    capable: true,
    title: "Splitty",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FF00B7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto flex min-h-screen max-w-xl flex-col pb-20">
          <AppBootstrap>{children}</AppBootstrap>
        </div>
        <BottomNav />
        <InstallHint />
      </body>
    </html>
  );
}
