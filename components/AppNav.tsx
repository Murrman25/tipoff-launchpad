"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import DevPlanSwitcher from "@/components/DevPlanSwitcher";

const links = [
  { href: "/dashboard", label: "Games" },
  { href: "/alerts", label: "Alerts" },
  { href: "/notifications", label: "Notifications" },
  { href: "/settings", label: "Settings" },
  { href: "/pricing", label: "Pricing" }
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <header className="top-bar">
      <div className="top-bar-inner">
        <Link className="brand-logo" href="/">
          <Image
            src="/tipoffhq_logo.png"
            alt="TipOffHQ"
            width={160}
            height={40}
            priority
            className="brand-logo-image"
          />
        </Link>
        <nav className="nav-links">
          {links.map((link) => {
            const isActive = pathname === link.href || (pathname?.startsWith(link.href) && link.href !== "/");
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
        </nav>
        <div className="nav-actions">
          <Link className="nav-signin" href="/settings">
            Sign in
          </Link>
          <Link className="btn btn-primary nav-cta" href="/pricing">
            Start free
          </Link>
          <DevPlanSwitcher />
        </div>
      </div>
    </header>
  );
}
