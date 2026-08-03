import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const PASSWORD = "Uklidno123";

/** Pomocníci pro data relativní k dnešku, aby seed nezestárl. */
const day = 24 * 3600 * 1000;
const daysFromNow = (n: number) => new Date(Date.now() + n * day);
const daysAgo = (n: number) => new Date(Date.now() - n * day);

function at(daysOffset: number, hour: number, minute = 0) {
  const d = new Date(Date.now() + daysOffset * day);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** Pracovní týden 8–16 jako výchozí dostupnost. */
const weekdays9to5 = [1, 2, 3, 4, 5].map((weekday) => ({
  weekday,
  startMin: 8 * 60,
  endMin: 16 * 60,
}));

async function main() {
  console.log("Mažu stará data…");
  // Pořadí kvůli cizím klíčům; kaskády pokrývají zbytek.
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.match.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.jobRequest.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  console.log("Zakládám uklízečky…");

  const cleanersData = [
    {
      email: "jana.novakova@example.com",
      firstName: "Jana",
      lastName: "Nováková",
      phone: "+420 777 111 222",
      headline: "Pečlivý úklid domácností a žehlení, 12 let praxe",
      bio: "Uklízím byty a rodinné domy v Praze a okolí. Specializuji se na domácnosti s dětmi a mazlíčky, používám ekologickou drogerii Tierra Verde. Žehlení košil beru jako svou parádní disciplínu.",
      city: "Praha",
      postalCode: "150 00",
      radiusKm: 20,
      yearsExperience: 12,
      hourlyRate: 39000,
      hasOwnSupplies: true,
      hasCar: true,
      invoices: true,
      criminalRecordChecked: true,
      verified: true,
      verificationState: "APPROVED",
      services: ["HOME_CLEANING", "IRONING", "WINDOWS", "LAUNDRY"],
      languages: [
        { language: "cs", level: "NATIVE" },
        { language: "en", level: "INTERMEDIATE" },
      ],
      availability: weekdays9to5,
    },
    {
      email: "olena.kovalenko@example.com",
      firstName: "Olena",
      lastName: "Kovalenko",
      phone: "+420 776 333 444",
      headline: "Generální úklid a úklid po rekonstrukci",
      bio: "Deset let uklízím kanceláře i domácnosti. Nebojím se náročných zakázek – po malířích, po stěhování, před předáním bytu. Mluvím ukrajinsky, česky a rusky.",
      city: "Praha",
      postalCode: "180 00",
      radiusKm: 30,
      yearsExperience: 10,
      hourlyRate: 36000,
      hasOwnSupplies: true,
      hasCar: true,
      invoices: true,
      criminalRecordChecked: true,
      verified: true,
      verificationState: "APPROVED",
      services: ["DEEP_CLEANING", "POST_RENOVATION", "OFFICE_CLEANING", "HOME_CLEANING"],
      languages: [
        { language: "uk", level: "NATIVE" },
        { language: "cs", level: "FLUENT" },
        { language: "ru", level: "NATIVE" },
      ],
      availability: [
        ...weekdays9to5,
        { weekday: 6, startMin: 9 * 60, endMin: 14 * 60 },
      ],
    },
    {
      email: "petr.svoboda@example.com",
      firstName: "Petr",
      lastName: "Svoboda",
      phone: "+420 775 555 666",
      headline: "Mytí oken a úklid kanceláří, večerní termíny",
      bio: "Pracuji hlavně pro firmy – kanceláře, ordinace, showroomy. Umím i výškové mytí oken. Uklízím po pracovní době, aby vám to nenarušilo provoz.",
      city: "Brno",
      postalCode: "602 00",
      radiusKm: 25,
      yearsExperience: 6,
      hourlyRate: 42000,
      hasOwnSupplies: true,
      hasCar: true,
      invoices: true,
      criminalRecordChecked: false,
      verified: true,
      verificationState: "APPROVED",
      services: ["OFFICE_CLEANING", "WINDOWS", "DEEP_CLEANING"],
      languages: [
        { language: "cs", level: "NATIVE" },
        { language: "en", level: "FLUENT" },
        { language: "de", level: "BASIC" },
      ],
      availability: [1, 2, 3, 4, 5].map((weekday) => ({
        weekday,
        startMin: 16 * 60,
        endMin: 22 * 60,
      })),
    },
    {
      email: "maria.horvathova@example.com",
      firstName: "Mária",
      lastName: "Horváthová",
      phone: "+420 774 777 888",
      headline: "Pravidelný úklid bytů, k dispozici i o víkendu",
      bio: "Jsem ze Slovenska, v Praze uklízím sedm let. Nejraději mám pravidelné klienty, u kterých se člověk naučí, jak to mají doma rádi. Domluvím se anglicky.",
      city: "Praha",
      postalCode: "160 00",
      radiusKm: 15,
      yearsExperience: 7,
      hourlyRate: 33000,
      hasOwnSupplies: false,
      hasCar: false,
      invoices: false,
      criminalRecordChecked: true,
      verified: true,
      verificationState: "APPROVED",
      services: ["HOME_CLEANING", "IRONING", "LAUNDRY"],
      languages: [
        { language: "sk", level: "NATIVE" },
        { language: "cs", level: "FLUENT" },
        { language: "en", level: "INTERMEDIATE" },
      ],
      availability: [
        { weekday: 1, startMin: 7 * 60, endMin: 15 * 60 },
        { weekday: 3, startMin: 7 * 60, endMin: 15 * 60 },
        { weekday: 5, startMin: 7 * 60, endMin: 15 * 60 },
        { weekday: 6, startMin: 8 * 60, endMin: 12 * 60 },
      ],
    },
    {
      email: "thi.nguyenova@example.com",
      firstName: "Thi Mai",
      lastName: "Nguyenová",
      phone: "+420 773 999 000",
      headline: "Úklid domácností, žehlení, praní – Praha 4 a 11",
      bio: "Uklízím rodinné domy a větší byty. Jsem zvyklá pracovat samostatně, klienti mi často nechávají klíče. Vše, co slíbím, dodržím.",
      city: "Praha",
      postalCode: "140 00",
      radiusKm: 12,
      yearsExperience: 4,
      hourlyRate: 30000,
      hasOwnSupplies: false,
      hasCar: false,
      invoices: false,
      criminalRecordChecked: false,
      verified: false,
      verificationState: "PENDING",
      services: ["HOME_CLEANING", "IRONING", "LAUNDRY"],
      languages: [
        { language: "vi", level: "NATIVE" },
        { language: "cs", level: "INTERMEDIATE" },
      ],
      availability: weekdays9to5,
    },
  ];

  const cleaners = [];
  for (const data of cleanersData) {
    const { services, languages, availability, ...profile } = data;
    const user = await prisma.user.create({
      data: {
        email: profile.email,
        passwordHash,
        role: "CLEANER",
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        emailVerified: daysAgo(40),
        cleanerProfile: {
          create: {
            headline: profile.headline,
            bio: profile.bio,
            city: profile.city,
            postalCode: profile.postalCode,
            radiusKm: profile.radiusKm,
            yearsExperience: profile.yearsExperience,
            hourlyRate: profile.hourlyRate,
            hasOwnSupplies: profile.hasOwnSupplies,
            hasCar: profile.hasCar,
            invoices: profile.invoices,
            criminalRecordChecked: profile.criminalRecordChecked,
            verified: profile.verified,
            verificationState: profile.verificationState,
            services: { create: services.map((service) => ({ service })) },
            languages: { create: languages },
            availability: { create: availability },
          },
        },
      },
      include: { cleanerProfile: true },
    });
    cleaners.push(user);
  }

  console.log("Zakládám klienty…");

  const clientsData = [
    {
      email: "tomas.riha@example.com",
      firstName: "Tomáš",
      lastName: "Říha",
      phone: "+420 602 123 456",
      city: "Praha",
      street: "Korunní 12",
      postalCode: "120 00",
      placeType: "APARTMENT",
      areaM2: 96,
      hasPets: true,
    },
    {
      email: "lucie.bartosova@example.com",
      firstName: "Lucie",
      lastName: "Bartošová",
      phone: "+420 603 234 567",
      city: "Praha",
      street: "Nad Palatou 8",
      postalCode: "150 00",
      placeType: "HOUSE",
      areaM2: 180,
      hasPets: false,
    },
    {
      email: "martin.dvorak@example.com",
      firstName: "Martin",
      lastName: "Dvořák",
      phone: "+420 604 345 678",
      city: "Brno",
      street: "Veveří 45",
      postalCode: "602 00",
      placeType: "OFFICE",
      areaM2: 240,
      hasPets: false,
    },
  ];

  const clients = [];
  for (const c of clientsData) {
    const user = await prisma.user.create({
      data: {
        email: c.email,
        passwordHash,
        role: "CLIENT",
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        emailVerified: daysAgo(20),
        clientProfile: {
          create: {
            street: c.street,
            city: c.city,
            postalCode: c.postalCode,
            placeType: c.placeType,
            areaM2: c.areaM2,
            hasPets: c.hasPets,
          },
        },
      },
    });
    clients.push(user);
  }

  await prisma.user.create({
    data: {
      email: "admin@uklidno.cz",
      passwordHash,
      role: "ADMIN",
      firstName: "Provoz",
      lastName: "Uklidno",
      emailVerified: daysAgo(90),
    },
  });

  console.log("Zakládám platební metody…");
  for (const user of [...clients, ...cleaners]) {
    await prisma.paymentMethod.create({
      data: {
        userId: user.id,
        type: "CARD",
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: new Date().getFullYear() + 3,
        providerToken: `mock_pm_seed_${user.id}`,
        provider: "mock",
        isDefault: true,
      },
    });
  }

  console.log("Zakládám poptávky a nabídky…");

  // 1) Otevřená poptávka s několika nabídkami – hlavní demo pro výběr uklízečky.
  const openRequest = await prisma.jobRequest.create({
    data: {
      clientId: clients[0].id,
      title: "Pravidelný úklid bytu 3+kk na Vinohradech",
      description:
        "Hledáme někoho na pravidelný úklid každých 14 dní. Byt 96 m², dvě koupelny, máme kocoura. Součástí by bylo i vyžehlení košil (cca 8 kusů). Ideálně dopoledne v pracovní den, klíče předáme.",
      city: "Praha",
      postalCode: "120 00",
      street: "Korunní 12",
      areaM2: 96,
      frequency: "BIWEEKLY",
      estimatedHours: 4,
      budgetPerHour: 40000,
      preferredFrom: daysFromNow(3),
      preferredTo: daysFromNow(30),
      services: { create: [{ service: "HOME_CLEANING" }, { service: "IRONING" }] },
    },
  });

  await prisma.offer.createMany({
    data: [
      {
        jobRequestId: openRequest.id,
        cleanerId: cleaners[0].cleanerProfile!.id,
        message:
          "Dobrý den, pravidelný úklid bytu na Vinohradech mi sedí do trasy. S kočkou problém nemám, mám i vlastní ekologickou drogerii. Košile žehlím běžně, 8 kusů zvládnu do hodiny.",
        pricePerHour: 39000,
        availableFrom: daysFromNow(4),
      },
      {
        jobRequestId: openRequest.id,
        cleanerId: cleaners[3].cleanerProfile!.id,
        message:
          "Dobrý den, ráda si vezmu pravidelný úklid. Mám volné pondělí a středu dopoledne, což by vám podle poptávky mohlo vyhovovat. Drogerii bych používala vaši.",
        pricePerHour: 33000,
        availableFrom: daysFromNow(6),
      },
      {
        jobRequestId: openRequest.id,
        cleanerId: cleaners[4].cleanerProfile!.id,
        message:
          "Dobrý den, bydlím na Praze 4, na Vinohrady to mám kousek. Úklid i žehlení dělám pravidelně u tří rodin. Ráda se domluvím na zkušebním úklidu.",
        pricePerHour: 30000,
        availableFrom: daysFromNow(2),
      },
    ],
  });

  // 2) Druhá otevřená poptávka – aby měly uklízečky v Brně na co reagovat.
  const brnoRequest = await prisma.jobRequest.create({
    data: {
      clientId: clients[2].id,
      title: "Úklid kanceláří 240 m² 2× týdně, Brno-střed",
      description:
        "Hledáme spolehlivý úklid kanceláří pro tým 25 lidí. Dvakrát týdně po 18. hodině, cca 3 hodiny. Zahrnuje kuchyňku, dvě sociální zařízení a zasedačku. Vyžadujeme fakturaci.",
      city: "Brno",
      postalCode: "602 00",
      street: "Veveří 45",
      areaM2: 240,
      frequency: "WEEKLY",
      estimatedHours: 3,
      budgetPerHour: 45000,
      preferredFrom: daysFromNow(7),
      services: { create: [{ service: "OFFICE_CLEANING" }] },
    },
  });

  await prisma.offer.create({
    data: {
      jobRequestId: brnoRequest.id,
      cleanerId: cleaners[2].cleanerProfile!.id,
      message:
        "Dobrý den, úklid kanceláří po pracovní době je přesně moje parketa – dělám to pro čtyři firmy v centru Brna. Fakturuji, mám živnostenský list i vlastní vybavení. Nabízím nezávaznou prohlídku prostor.",
      pricePerHour: 42000,
      availableFrom: daysFromNow(8),
    },
  });

  console.log("Zakládám hotové propojení s historií…");

  // 3) Propojená poptávka s historií rezervací a hodnocení – demo „živého“ účtu.
  const matchedRequest = await prisma.jobRequest.create({
    data: {
      clientId: clients[1].id,
      title: "Úklid rodinného domu v Hlubočepích, jednou týdně",
      description:
        "Dům 180 m², dvě patra, zahrada. Hledám někoho na pravidelný týdenní úklid včetně žehlení. Preferuji dlouhodobou spolupráci.",
      city: "Praha",
      postalCode: "150 00",
      street: "Nad Palatou 8",
      areaM2: 180,
      frequency: "WEEKLY",
      estimatedHours: 5,
      budgetPerHour: 42000,
      status: "MATCHED",
      createdAt: daysAgo(45),
      services: { create: [{ service: "HOME_CLEANING" }, { service: "IRONING" }] },
    },
  });

  const acceptedOffer = await prisma.offer.create({
    data: {
      jobRequestId: matchedRequest.id,
      cleanerId: cleaners[0].cleanerProfile!.id,
      message:
        "Dobrý den, dům v Hlubočepích bych ráda vzala. Mám volný čtvrtek dopoledne, dojedu autem s vlastním vybavením.",
      pricePerHour: 40000,
      status: "ACCEPTED",
      createdAt: daysAgo(44),
    },
  });

  const match = await prisma.match.create({
    data: {
      jobRequestId: matchedRequest.id,
      offerId: acceptedOffer.id,
      clientId: clients[1].id,
      cleanerId: cleaners[0].cleanerProfile!.id,
      status: "ACTIVE",
      contactUnlockedAt: daysAgo(43),
      createdAt: daysAgo(43),
      conversation: { create: {} },
    },
    include: { conversation: true },
  });

  await prisma.payment.create({
    data: {
      userId: clients[1].id,
      matchId: match.id,
      purpose: "CONNECTION_FEE",
      amount: 24900,
      status: "PAID",
      provider: "mock",
      providerRef: "mock_ch_seed_connection",
      description: "Zprostředkování kontaktu – Jana Nováková",
      paidAt: daysAgo(43),
      createdAt: daysAgo(43),
    },
  });

  const subscription = await prisma.subscription.create({
    data: {
      userId: clients[1].id,
      plan: "CLIENT_BASIC",
      amount: 9900,
      status: "ACTIVE",
      currentPeriodStart: daysAgo(13),
      currentPeriodEnd: daysFromNow(17),
      provider: "mock",
      createdAt: daysAgo(43),
    },
  });

  for (const offset of [43, 13]) {
    await prisma.payment.create({
      data: {
        userId: clients[1].id,
        subscriptionId: subscription.id,
        purpose: "SUBSCRIPTION",
        amount: 9900,
        status: "PAID",
        provider: "mock",
        providerRef: `mock_ch_seed_sub_${offset}`,
        description: "Předplatné Plánovač – měsíc",
        paidAt: daysAgo(offset),
        createdAt: daysAgo(offset),
      },
    });
  }

  await prisma.message.createMany({
    data: [
      {
        conversationId: match.conversation!.id,
        senderId: clients[1].id,
        body: "Dobrý den Jano, děkuji za nabídku. Vyhovoval by vám čtvrtek od 8:00?",
        createdAt: daysAgo(43),
        readAt: daysAgo(43),
      },
      {
        conversationId: match.conversation!.id,
        senderId: cleaners[0].id,
        body: "Dobrý den, čtvrtek 8:00 je ideální. Přivezu si vlastní vysavač a drogerii.",
        createdAt: daysAgo(42),
        readAt: daysAgo(42),
      },
      {
        conversationId: match.conversation!.id,
        senderId: clients[1].id,
        body: "Skvělé, klíče vám nechám u sousedky. Příští týden budu na služební cestě, tak to takhle bude fungovat nejlépe.",
        createdAt: daysAgo(20),
      },
    ],
  });

  console.log("Zakládám rezervace a hodnocení…");

  const completed = [
    { offset: -35, rating: 5, comment: "Naprostá spokojenost, dům zářil. Paní Nováková je velmi pečlivá a spolehlivá." },
    { offset: -28, rating: 5, comment: "Znovu bez chybičky. Oceňuji, že si všímá i věcí, na které bych sám nepomyslel." },
    { offset: -21, rating: 4, comment: "Vše v pořádku, jen žehlení zabralo víc času, než jsme čekali." },
    { offset: -14, rating: 5, comment: "Perfektní. Domluva přes aplikaci funguje výborně, termíny sedí." },
    { offset: -7, rating: 5, comment: null },
  ];

  for (const c of completed) {
    const booking = await prisma.booking.create({
      data: {
        matchId: match.id,
        clientId: clients[1].id,
        cleanerId: cleaners[0].cleanerProfile!.id,
        start: at(c.offset, 8),
        end: at(c.offset, 13),
        service: "HOME_CLEANING",
        address: "Nad Palatou 8, Praha 5",
        priceTotal: 200000,
        status: "COMPLETED",
        createdAt: daysAgo(-c.offset + 5),
      },
    });

    await prisma.review.create({
      data: {
        bookingId: booking.id,
        authorId: clients[1].id,
        targetId: cleaners[0].id,
        rating: c.rating,
        quality: c.rating,
        punctuality: 5,
        communication: c.rating,
        comment: c.comment,
        createdAt: at(c.offset, 18),
      },
    });
  }

  // Nadcházející rezervace – aby dashboard nebyl prázdný.
  await prisma.booking.create({
    data: {
      matchId: match.id,
      clientId: clients[1].id,
      cleanerId: cleaners[0].cleanerProfile!.id,
      start: at(2, 8),
      end: at(2, 13),
      service: "HOME_CLEANING",
      address: "Nad Palatou 8, Praha 5",
      priceTotal: 200000,
      status: "CONFIRMED",
    },
  });

  await prisma.booking.create({
    data: {
      matchId: match.id,
      clientId: clients[1].id,
      cleanerId: cleaners[0].cleanerProfile!.id,
      start: at(9, 8),
      end: at(9, 13),
      service: "HOME_CLEANING",
      address: "Nad Palatou 8, Praha 5",
      priceTotal: 200000,
      status: "REQUESTED",
    },
  });

  // Hodnocení z dřívějška u dalších uklízeček, ať mají filtry co řadit.
  const extraReviews: Array<[number, number[]]> = [
    [1, [5, 5, 4, 5, 5, 4]],
    [2, [5, 4, 5, 5]],
    [3, [4, 5, 4]],
  ];

  for (const [cleanerIndex, ratings] of extraReviews) {
    for (let i = 0; i < ratings.length; i++) {
      const client = clients[i % clients.length];
      const booking = await prisma.booking.create({
        data: {
          clientId: client.id,
          cleanerId: cleaners[cleanerIndex].cleanerProfile!.id,
          start: at(-60 - i * 7, 9),
          end: at(-60 - i * 7, 13),
          service: "HOME_CLEANING",
          status: "COMPLETED",
        },
      });
      await prisma.review.create({
        data: {
          bookingId: booking.id,
          authorId: client.id,
          targetId: cleaners[cleanerIndex].id,
          rating: ratings[i],
          quality: ratings[i],
          punctuality: ratings[i],
          communication: ratings[i],
          createdAt: at(-60 - i * 7, 18),
        },
      });
    }
  }

  console.log("Přepočítávám hodnocení…");
  for (const cleaner of cleaners) {
    const stats = await prisma.review.aggregate({
      where: { targetId: cleaner.id },
      _avg: { rating: true },
      _count: true,
    });
    const jobs = await prisma.booking.count({
      where: { cleanerId: cleaner.cleanerProfile!.id, status: "COMPLETED" },
    });
    await prisma.cleanerProfile.update({
      where: { id: cleaner.cleanerProfile!.id },
      data: {
        ratingAvg: stats._avg.rating ?? 0,
        ratingCount: stats._count,
        completedJobs: jobs,
      },
    });
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: clients[0].id,
        type: "NEW_OFFER",
        title: "Máte 3 nové nabídky",
        body: "Na poptávku „Pravidelný úklid bytu 3+kk na Vinohradech“ reagovaly tři uklízečky.",
        href: `/poptavky/${openRequest.id}`,
      },
      {
        userId: cleaners[0].id,
        type: "BOOKING_REQUESTED",
        title: "Nová žádost o termín",
        body: "Lucie Bartošová vás žádá o úklid.",
        href: "/dashboard/rezervace",
      },
    ],
  });

  console.log("\nHotovo. Testovací účty (heslo pro všechny: %s)", PASSWORD);
  console.table([
    { role: "Klient (s předplatným a historií)", email: clients[1].email },
    { role: "Klient (čerstvá poptávka s nabídkami)", email: clients[0].email },
    { role: "Klient (firma, Brno)", email: clients[2].email },
    { role: "Uklízečka (nejlépe hodnocená)", email: cleaners[0].email },
    { role: "Uklízečka (Brno, kanceláře)", email: cleaners[2].email },
    { role: "Admin", email: "admin@uklidno.cz" },
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
