"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/", label: "Contracts" },
  { href: "/playbook", label: "Playbook" },
];

// A route is "active" for a nav item if it's an exact match, or a sub-route
// of it (e.g. /contracts/new and /contracts/[id] both light up "Contracts").
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname.startsWith("/contracts");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <>
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "rounded-md border px-3 py-1.5 transition",
              active
                ? "border-brand-200 bg-brand-50 font-medium text-brand-700"
                : "border-transparent text-muted hover:bg-canvas hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
