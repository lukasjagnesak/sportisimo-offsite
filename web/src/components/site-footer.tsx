import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-ink-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex size-7 items-center justify-center rounded-lg bg-ink-700 text-sm text-white">
              U
            </span>
            Uklidno
          </div>
          <p className="mt-3 text-sm text-ink-600">
            Propojujeme domácnosti a firmy s prověřenými uklízečkami a uklízeči. Bez agentury,
            bez provize z každé hodiny.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink-900">Pro klienty</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-600">
            <li>
              <Link href="/poptavky/nova" className="hover:text-ink-900">
                Zadat poptávku
              </Link>
            </li>
            <li>
              <Link href="/uklizecky" className="hover:text-ink-900">
                Procházet uklízečky
              </Link>
            </li>
            <li>
              <Link href="/cenik" className="hover:text-ink-900">
                Ceník
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink-900">Pro uklízečky</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-600">
            <li>
              <Link href="/registrace?role=CLEANER" className="hover:text-ink-900">
                Chci zakázky
              </Link>
            </li>
            <li>
              <Link href="/poptavky" className="hover:text-ink-900">
                Aktuální poptávky
              </Link>
            </li>
            <li>
              <Link href="/jak-to-funguje" className="hover:text-ink-900">
                Jak to funguje
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink-900">Uklidno</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-600">
            <li>
              <Link href="/podminky" className="hover:text-ink-900">
                Obchodní podmínky
              </Link>
            </li>
            <li>
              <Link href="/soukromi" className="hover:text-ink-900">
                Ochrana osobních údajů
              </Link>
            </li>
            <li>
              <a href="mailto:podpora@uklidno.cz" className="hover:text-ink-900">
                podpora@uklidno.cz
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-100 px-4 py-5 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} Uklidno. Zprostředkováváme kontakt, samotný úklid je vždy
        smlouvou mezi klientem a poskytovatelem služby.
      </div>
    </footer>
  );
}
