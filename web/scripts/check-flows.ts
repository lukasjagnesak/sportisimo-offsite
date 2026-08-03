/**
 * Integrační kontrola klíčových pravidel obchodní logiky proti reálné databázi.
 * Běží mimo HTTP vrstvu (server actions potřebují request kontext), takže sem
 * patří všechno, co musí platit bez ohledu na UI.
 *
 * Spuštění: npm run check:flows   (nejdřív npm run db:reset && npm run db:seed)
 */
import { PrismaClient } from "../src/generated/prisma";
import { getFreeSlots, isSlotBookable, addDays, startOfDay } from "../src/lib/availability";
import { chargeUser } from "../src/lib/payments";
import { subscribe, hasActiveSubscription, cancelAtPeriodEnd } from "../src/lib/subscription";
import { FEES, vatBreakdown } from "../src/lib/fees";

const prisma = new PrismaClient();

let pass = 0;
let fail = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ok   ${name}`);
    pass++;
  } else {
    console.log(`  FAIL ${name}${detail ? ` – ${detail}` : ""}`);
    fail++;
  }
}

async function main() {
  console.log("== kalendář a sloty ==");

  const jana = await prisma.cleanerProfile.findFirstOrThrow({
    where: { user: { email: "jana.novakova@example.com" } },
  });

  const slots = await getFreeSlots(jana.id, new Date(), addDays(new Date(), 14), 120);
  check("Jana má volné sloty na 14 dní", slots.length > 0, `${slots.length}`);
  check(
    "žádný slot není o víkendu (pracuje po–pá)",
    slots.every((s) => ![0, 6].includes(s.start.getDay())),
  );
  check(
    "žádný slot není dřív než za 12 hodin",
    slots.every((s) => s.start.getTime() > Date.now() + 11.5 * 3600 * 1000),
  );
  check(
    "sloty leží uvnitř 8:00–16:00",
    slots.every((s) => s.start.getHours() >= 8 && s.end.getHours() <= 16),
  );

  // Existující potvrzená rezervace musí ze slotů zmizet.
  const booked = await prisma.booking.findFirst({
    where: { cleanerId: jana.id, status: "CONFIRMED", start: { gte: new Date() } },
  });
  if (booked) {
    check(
      "obsazený termín se v nabídce neobjeví",
      !slots.some((s) => s.start < booked.end && booked.start < s.end),
    );
  }

  console.log("\n== validace rezervace ==");

  const soon = new Date(Date.now() + 2 * 3600 * 1000);
  const tooSoon = await isSlotBookable(jana.id, soon, new Date(soon.getTime() + 2 * 3600 * 1000));
  check("rezervace za 2 hodiny je odmítnuta", !tooSoon.ok);

  const farAway = addDays(new Date(), 200);
  const tooFar = await isSlotBookable(
    jana.id,
    farAway,
    new Date(farAway.getTime() + 2 * 3600 * 1000),
  );
  check("rezervace 200 dní dopředu je odmítnuta", !tooFar.ok);

  // Neděle – Jana nepracuje.
  const sunday = startOfDay(addDays(new Date(), (7 - new Date().getDay()) % 7 || 7));
  sunday.setHours(10);
  const onSunday = await isSlotBookable(
    jana.id,
    sunday,
    new Date(sunday.getTime() + 2 * 3600 * 1000),
  );
  check("neděle mimo dostupnost je odmítnuta", !onSunday.ok, onSunday.ok ? "" : onSunday.reason);

  if (slots.length > 0) {
    const free = slots[0];
    const ok = await isSlotBookable(jana.id, free.start, free.end);
    check("volný slot z kalendáře projde validací", ok.ok, ok.ok ? "" : ok.reason);
  }

  console.log("\n== dovolená blokuje kalendář ==");

  const holiday = startOfDay(addDays(new Date(), 3));
  const exception = await prisma.availabilityException.create({
    data: { cleanerId: jana.id, date: holiday, blocked: true, note: "test" },
  });
  const afterHoliday = await getFreeSlots(jana.id, holiday, holiday, 120);
  check("v den dovolené nejsou žádné sloty", afterHoliday.length === 0);
  await prisma.availabilityException.delete({ where: { id: exception.id } });

  console.log("\n== platby ==");

  const tomas = await prisma.user.findFirstOrThrow({
    where: { email: "tomas.riha@example.com" },
  });

  const charge = await chargeUser({
    userId: tomas.id,
    purpose: "CONNECTION_FEE",
    amount: FEES.CONNECTION_FEE,
    description: "Test – zprostředkování",
  });
  check("platba přes uloženou kartu projde", charge.ok);

  if (charge.ok) {
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: charge.paymentId } });
    check("platba je ve stavu PAID", payment.status === "PAID");
    check("platba má referenci od brány", Boolean(payment.providerRef));
    check("částka odpovídá ceníku", payment.amount === FEES.CONNECTION_FEE);
    await prisma.payment.delete({ where: { id: payment.id } });
  }

  // Uživatel bez karty nesmí projít.
  const noCard = await prisma.user.create({
    data: {
      email: `test-bez-karty-${Date.now()}@example.com`,
      passwordHash: "x",
      role: "CLIENT",
      firstName: "Bez",
      lastName: "Karty",
    },
  });
  const failed = await chargeUser({
    userId: noCard.id,
    purpose: "CONNECTION_FEE",
    amount: FEES.CONNECTION_FEE,
    description: "Test bez karty",
  });
  check("bez platební metody platba selže", !failed.ok);

  // Zamítnutá karta musí zanechat FAILED záznam.
  await prisma.paymentMethod.create({
    data: {
      userId: noCard.id,
      providerToken: "mock_pm_declined_0000",
      brand: "visa",
      last4: "0000",
      isDefault: true,
    },
  });
  const declined = await chargeUser({
    userId: noCard.id,
    purpose: "CONNECTION_FEE",
    amount: FEES.CONNECTION_FEE,
    description: "Test zamítnuté karty",
  });
  check("zamítnutá karta vrátí chybu", !declined.ok);
  const failedPayment = await prisma.payment.findFirst({
    where: { userId: noCard.id, status: "FAILED" },
  });
  check("neúspěšná platba zůstane v historii", failedPayment !== null);

  console.log("\n== předplatné ==");

  check("Tomáš zatím předplatné nemá", !(await hasActiveSubscription(tomas.id)));

  const sub = await subscribe(tomas.id, "CLIENT_BASIC");
  check("aktivace předplatného projde", sub.ok);
  check("po aktivaci je předplatné aktivní", await hasActiveSubscription(tomas.id));

  if (sub.ok) {
    const record = await prisma.subscription.findUniqueOrThrow({
      where: { id: sub.subscriptionId },
    });
    check("cena předplatného je 99 Kč", record.amount === 9900);
    check(
      "období končí zhruba za měsíc",
      record.currentPeriodEnd.getTime() > Date.now() + 27 * 24 * 3600 * 1000,
    );

    const subPayment = await prisma.payment.findFirst({
      where: { subscriptionId: record.id, status: "PAID" },
    });
    check("za předplatné vznikla platba", subPayment !== null);

    await cancelAtPeriodEnd(tomas.id);
    const cancelled = await prisma.subscription.findUniqueOrThrow({ where: { id: record.id } });
    check("zrušení nastaví cancelAtPeriodEnd", cancelled.cancelAtPeriodEnd);
    check("zrušené předplatné běží do konce období", await hasActiveSubscription(tomas.id));

    await prisma.payment.deleteMany({ where: { subscriptionId: record.id } });
    await prisma.subscription.delete({ where: { id: record.id } });
  }

  // Úklid testovacího uživatele.
  await prisma.user.delete({ where: { id: noCard.id } });

  console.log("\n== ceny a DPH ==");

  const vat = vatBreakdown(FEES.CONNECTION_FEE);
  check("základ + DPH dá celkovou částku", vat.base + vat.vat === FEES.CONNECTION_FEE);
  check("sazba DPH je 21 %", vat.rate === 21);

  console.log("\n== konzistence propojení ==");

  const match = await prisma.match.findFirstOrThrow({
    where: { status: "ACTIVE" },
    include: { jobRequest: true, conversation: true, payments: true },
  });
  check("propojení má konverzaci", match.conversation !== null);
  check("poptávka je označená jako MATCHED", match.jobRequest.status === "MATCHED");
  check("propojení má odemčený kontakt", match.contactUnlockedAt !== null);
  check(
    "k propojení existuje zaplacený poplatek",
    match.payments.some((p) => p.purpose === "CONNECTION_FEE" && p.status === "PAID"),
  );

  const acceptedOffer = await prisma.offer.findUniqueOrThrow({ where: { id: match.offerId } });
  check("vybraná nabídka je ACCEPTED", acceptedOffer.status === "ACCEPTED");

  const siblingOffers = await prisma.offer.findMany({
    where: { jobRequestId: match.jobRequestId, id: { not: match.offerId } },
  });
  check(
    "ostatní nabídky u propojené poptávky nejsou PENDING",
    siblingOffers.every((o) => o.status !== "PENDING"),
  );

  console.log("\n== hodnocení ==");

  const cleaners = await prisma.cleanerProfile.findMany({ include: { user: true } });
  for (const cleaner of cleaners) {
    const stats = await prisma.review.aggregate({
      where: { targetId: cleaner.userId },
      _avg: { rating: true },
      _count: true,
    });
    const expected = stats._avg.rating ?? 0;
    check(
      `průměr hodnocení sedí u ${cleaner.user.lastName}`,
      Math.abs(cleaner.ratingAvg - expected) < 0.01 && cleaner.ratingCount === stats._count,
      `profil ${cleaner.ratingAvg}/${cleaner.ratingCount}, spočteno ${expected}/${stats._count}`,
    );
  }

  console.log(`\nVýsledek: ${pass} ok, ${fail} selhalo`);
  if (fail > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
