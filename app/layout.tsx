import "./globals.css";
import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import AppNav from "@/components/AppNav";
import ToastProvider from "@/components/ToastProvider";
import { PlanProvider } from "@/lib/plan";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans"
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "TipOff",
  description: "Real-time sports line movement and alerting platform."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetBrainsMono.variable}`}>
      <body>
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
