import "./globals.css";
import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/BottomNav";
import { AppBootstrap } from "@/components/AppBootstrap";

export const metadata: Metadata = {
  title: "Housemate Expenses",
  description: "Shared expense tracker for the house",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0ea5e9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto flex min-h-screen max-w-xl flex-col pb-20">
          <AppBootstrap>{children}</AppBootstrap>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
