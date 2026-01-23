"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import DevPlanSwitcher from "@/components/DevPlanSwitcher";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/alerts", label: "Alerts" },
  { href: "/bets", label: "Bets" },
  { href: "/tools", label: "Tools" },
  { href: "/targets", label: "Targets" },
  { href: "/pricing", label: "Pricing" },
  { href: "/notifications", label: "Notifications" }
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <header className="top-bar">
      <div className="brand">
        <h1>TipOff</h1>
        <span>Real-time line movement intelligence</span>
      </div>
      <nav className="nav-links">
        {links.map((link) => {
          const isActive = pathname?.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link${isActive ? " active" : ""}`}
            >
              {link.label}
            </Link>
          );
        })}
        <DevPlanSwitcher />
      </nav>
    </header>
  );
}
