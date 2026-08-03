import { Alert, Card, PageHeader } from "@/components/ui";

export const metadata = { title: "Ochrana osobních údajů" };

/** Pracovní podklad pro GDPR dokumentaci – před spuštěním nutná právní revize. */
export default function PrivacyPage() {
  const dataRows = [
    ["Identifikační údaje", "Jméno, příjmení, e-mail, telefon", "Plnění smlouvy", "Po dobu účtu + 3 roky"],
    ["Adresa úklidu", "Ulice, město, PSČ", "Plnění smlouvy", "Po dobu spolupráce + 1 rok"],
    ["Profilové údaje poskytovatele", "Praxe, jazyky, sazba, popis", "Plnění smlouvy", "Po dobu účtu"],
    ["Platební údaje", "Token karty, značka, poslední 4 číslice", "Plnění smlouvy", "Po dobu účtu"],
    ["Doklady o platbách", "Částky, data, účel", "Právní povinnost (účetnictví)", "10 let"],
    ["Hodnocení a zprávy", "Text hodnocení, obsah chatu", "Oprávněný zájem (důvěra a bezpečnost)", "3 roky"],
    ["Technické údaje", "IP adresa, typ prohlížeče u přihlášení", "Oprávněný zájem (bezpečnost)", "12 měsíců"],
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeader
        title="Ochrana osobních údajů"
        description="Co o vás zpracováváme, proč a jak dlouho."
      />

      <div className="mb-8">
        <Alert tone="warning">
          Pracovní znění pro vývoj produktu. Před ostrým spuštěním musí projít revizí advokáta
          a doplnit se identifikace správce a pověřence.
        </Alert>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-ink-700">
        <section>
          <h2 className="font-semibold text-ink-900">Správce údajů</h2>
          <p className="mt-2">
            Správcem je provozovatel platformy Uklidno. Kontakt ve věcech osobních údajů:{" "}
            <a href="mailto:gdpr@uklidno.cz" className="font-medium text-ink-900 hover:underline">
              gdpr@uklidno.cz
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-ink-900">Jaké údaje zpracováváme</h2>
          <Card className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-xs">
              <thead className="border-b border-ink-100 uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Kategorie</th>
                  <th className="px-4 py-3 font-medium">Konkrétně</th>
                  <th className="px-4 py-3 font-medium">Právní titul</th>
                  <th className="px-4 py-3 font-medium">Doba uchování</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50 text-ink-700">
                {dataRows.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell) => (
                      <td key={cell} className="px-4 py-3 align-top">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>

        <section>
          <h2 className="font-semibold text-ink-900">Komu údaje předáváme</h2>
          <p className="mt-2">
            Protistraně v rámci propojení (jméno, telefon, e-mail, adresa úklidu) – a to až ve
            chvíli, kdy klient přijme nabídku. Do té doby se v poptávce zobrazuje pouze město.
          </p>
          <p className="mt-2">
            Dále platební bráně (zpracování plateb), poskytovateli hostingu a nástroji pro
            rozesílku e-mailů. Se všemi máme uzavřenou smlouvu o zpracování osobních údajů.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-ink-900">Platební údaje</h2>
          <p className="mt-2">
            Číslo platební karty se do naší databáze nikdy nedostane. Kartu tokenizuje platební
            brána; my ukládáme jen token, značku karty a poslední čtyři číslice, abyste poznali,
            kterou kartu máte uloženou.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-ink-900">Vaše práva</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Právo na přístup ke svým údajům a na jejich kopii.</li>
            <li>Právo na opravu nepřesných údajů – většinu upravíte přímo v profilu.</li>
            <li>Právo na výmaz, pokud netrvá zákonná povinnost údaje uchovat (např. účetnictví).</li>
            <li>Právo na omezení zpracování a právo vznést námitku proti oprávněnému zájmu.</li>
            <li>Právo na přenositelnost údajů ve strojově čitelném formátu.</li>
            <li>
              Právo podat stížnost u Úřadu pro ochranu osobních údajů (uoou.cz).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-ink-900">Cookies</h2>
          <p className="mt-2">
            Nezbytné cookies používáme pro přihlášení (session). Analytické a marketingové
            cookies – včetně měřicích kódů Meta a LinkedIn – nasazujeme až po vašem souhlasu
            v cookie liště.
          </p>
        </section>
      </div>
    </div>
  );
}
