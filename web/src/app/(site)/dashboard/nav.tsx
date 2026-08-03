"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";
import type { Role } from "@/lib/constants";

const clientLinks = [
  { href: "/dashboard", label: "Přehled" },
  { href: "/dashboard/poptavky", label: "Moje poptávky" },
  { href: "/dashboard/spoluprace", label: "Spolupráce" },
  { href: "/dashboard/rezervace", label: "Rezervace" },
  { href: "/dashboard/predplatne", label: "Předplatné" },
  { href: "/dashboard/platby", label: "Platby" },
  { href: "/dashboard/profil", label: "Můj profil" },
];

const cleanerLinks = [
  { href: "/dashboard", label: "Přehled" },
  { href: "/dashboard/nabidky", label: "Moje nabídky" },
  { href: "/dashboard/spoluprace", label: "Spolupráce" },
  { href: "/dashboard/rezervace", label: "Rezervace" },
  { href: "/dashboard/kalendar", label: "Kalendář" },
  { href: "/dashboard/platby", label: "Platby" },
  { href: "/dashboard/profil", label: "Můj profil" },
];

export function DashboardNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const links = role === "CLEANER" ? cleanerLinks : clientLinks;

  return (
    <nav className="lg:sticky lg:top-20 lg:h-fit">
      <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {links.map((link) => {
          // "/dashboard" nesmí svítit na všech podstránkách.
          const active =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);

          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                className={cx(
                  "block rounded-lg px-3 py-2 text-sm font-medium transition",
                  active ? "bg-ink-700 text-white" : "text-ink-700 hover:bg-ink-50",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
