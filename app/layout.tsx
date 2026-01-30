import "./globals.css";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import AppNav from "@/components/AppNav";
import ToastProvider from "@/components/ToastProvider";
import { PlanProvider } from "@/lib/plan";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans"
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "TipOff",
  description: "Real-time sports line and game-state alerts, fully customizable."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetBrainsMono.variable}`}>
      <body>
        <div className="ambient-blobs" aria-hidden="true">
          <span className="blob blob-primary" />
          <span className="blob blob-secondary" />
          <span className="blob blob-tertiary" />
          <span className="blob blob-bottom" />
        </div>
        <PlanProvider>
          <ToastProvider>
            <div className="app-shell">
              <AppNav />
              <main className="app-main">{children}</main>
            </div>
          </ToastProvider>
        </PlanProvider>
      </body>
    </html>
  );
}
