import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, ButtonLink } from "./ui";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const unread = user
    ? await prisma.notification.count({ where: { userId: user.id, readAt: null } })
    : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-sand-50/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3.5">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-ink-700 text-white">
            U
          </span>
          <span className="text-lg text-ink-900">Uklidno</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-ink-700 md:flex">
          <Link href="/uklizecky" className="hover:text-ink-900">
            Uklízečky
          </Link>
          {user?.role !== "CLIENT" && (
            <Link href="/poptavky" className="hover:text-ink-900">
              Poptávky
            </Link>
          )}
          <Link href="/cenik" className="hover:text-ink-900">
            Ceník
          </Link>
          <Link href="/jak-to-funguje" className="hover:text-ink-900">
            Jak to funguje
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="relative flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-ink-800 hover:bg-ink-50"
              >
                <Avatar firstName={user.firstName} lastName={user.lastName} size="sm" />
                <span className="hidden sm:block">{user.firstName}</span>
                {unread > 0 && (
                  <span className="absolute -top-0.5 left-7 flex size-4 items-center justify-center rounded-full bg-sand-500 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-lg px-2 py-1.5 text-sm text-ink-600 hover:text-ink-900"
                >
                  Odhlásit
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/prihlaseni" className="text-sm text-ink-700 hover:text-ink-900">
                Přihlásit
              </Link>
              <ButtonLink href="/registrace" size="sm">
                Vytvořit účet
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
