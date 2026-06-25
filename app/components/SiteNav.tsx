"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/benefit", label: "Water uses", match: "/benefit" },
  { href: "/gsl", label: "Reaches the GSL", match: "/gsl" },
  { href: "/basin", label: "The basin & method", match: "/basin" },
  { href: "/live", label: "Live monitor", match: "/live" },
];

export default function SiteNav() {
  const path = usePathname() || "/";
  const isActive = (l: { href: string; match?: string }) =>
    l.match ? path.startsWith(l.match) : path === l.href;
  return (
    <header className="topnav">
      <Link href="/" className="topnav-brand">
        <span className="mb-dot" />
        <span className="tn-title">Bear River Basin Monitor</span>
        <span className="tn-sub">water → downstream value</span>
      </Link>
      <nav className="topnav-links">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={isActive(l) ? "on" : ""}>
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
