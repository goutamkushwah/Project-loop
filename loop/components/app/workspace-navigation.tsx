"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type WorkspaceNavigationItem = {
  href: string;
  label: string;
};

type WorkspaceNavigationProps = {
  items: readonly WorkspaceNavigationItem[];
};

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function navigationLinkClassName(active: boolean): string {
  return [
    "inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-bold transition",
    "focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2",
    active
      ? "bg-loop-100 text-loop-950"
      : "text-slate-700 hover:bg-loop-50 hover:text-loop-900",
  ].join(" ");
}

export function WorkspaceNavigation({ items }: WorkspaceNavigationProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="hidden items-center gap-1 lg:flex" aria-label="Workspace navigation">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={navigationLinkClassName(active)}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="lg:hidden">
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="workspace-mobile-navigation"
          onClick={() => setMobileOpen((open) => !open)}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-loop-300 hover:bg-loop-50 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
        >
          <span aria-hidden="true" className="mr-2 text-base">
            {mobileOpen ? "×" : "☰"}
          </span>
          {mobileOpen ? "Close menu" : "Menu"}
        </button>

        {mobileOpen ? (
          <nav
            id="workspace-mobile-navigation"
            aria-label="Mobile workspace navigation"
            className="absolute left-5 right-5 top-full z-40 mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:left-8 sm:right-8"
          >
            <ul className="grid gap-1 sm:grid-cols-2">
              {items.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMobileOpen(false)}
                      className={`${navigationLinkClassName(active)} w-full`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}
      </div>
    </>
  );
}