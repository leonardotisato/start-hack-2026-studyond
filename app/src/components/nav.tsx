"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/profile", label: "Profile", match: ["/profile"] },
  { href: "/network", label: "Network", match: ["/network"] },
  { href: "/orientation", label: "Orientation", match: ["/orientation"] },
  { href: "/thesis-gps", label: "Thesis GPS", match: ["/thesis-gps", "/planner"] },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b">
      <div className="container mx-auto flex items-center gap-6 px-4 py-3">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          Studyond
        </Link>
        {NAV_LINKS.map((link) => {
          const isActive = link.match.some((p) => pathname === p || pathname.startsWith(p + "/"));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition ${
                isActive
                  ? "text-foreground font-medium border-b-2 border-primary pb-0.5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
