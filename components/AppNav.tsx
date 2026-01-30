"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import DevPlanSwitcher from "@/components/DevPlanSwitcher";

const featureLinks = [
  { href: "/dashboard", label: "Games" },
  { href: "/alerts", label: "Alerts" },
  { href: "/notifications", label: "Notifications" }
];

export default function AppNav() {
  const pathname = usePathname();
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setFeaturesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isFeatureActive = featureLinks.some(
    (link) => pathname === link.href || pathname?.startsWith(link.href)
  );

  return (
    <header className="top-bar">
      <div className="top-bar-inner compact">
        <Link className="brand-logo" href="/">
          <Image
            src="/tipoffhq_logo.png"
            alt="TipOffHQ"
            width={140}
            height={35}
            priority
            className="brand-logo-image"
          />
        </Link>

        <nav className="nav-links compact">
          {/* Features Dropdown */}
          <div className="nav-dropdown" ref={dropdownRef}>
            <button
              className={`nav-link nav-dropdown-trigger${isFeatureActive ? " active" : ""}`}
              onClick={() => setFeaturesOpen(!featuresOpen)}
              aria-expanded={featuresOpen}
            >
              Features
              <svg
                className={`nav-dropdown-chevron${featuresOpen ? " open" : ""}`}
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
              >
                <path
                  d="M1 1L5 5L9 1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {featuresOpen && (
              <div className="nav-dropdown-menu">
                {featureLinks.map((link) => {
                  const isActive = pathname === link.href || pathname?.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`nav-dropdown-item${isActive ? " active" : ""}`}
                      onClick={() => setFeaturesOpen(false)}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            href="/settings"
            className={`nav-link${pathname === "/settings" ? " active" : ""}`}
          >
            Settings
          </Link>

          <Link
            href="/pricing"
            className={`nav-link${pathname === "/pricing" ? " active" : ""}`}
          >
            Pricing
          </Link>
        </nav>

        <div className="nav-actions compact">
          <Link className="nav-signin" href="/settings">
            Sign in
          </Link>
          <Link className="btn btn-primary nav-cta compact" href="/pricing">
            Start free
          </Link>
          <DevPlanSwitcher />
        </div>
      </div>
    </header>
  );
}
