/**
 * Datos de prueba: un usuario demo con mazos variados (para probar filtros, estadísticas
 * y el estado de "sesión a medias") y un usuario recién registrado (para probar la
 * bienvenida). Idempotente: borra estos dos usuarios por email y los vuelve a crear con
 * los mismos datos, generados con una semilla fija.
 *
 * Corre fuera de Next (con `tsx`, ver `prisma.config.ts`), así que no importa nada con
 * `import "server-only"` ni el cliente de `lib/db/index.ts`.
 */
import "dotenv/config";
import { PrismaClient, Prisma } from "@/lib/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { hashPassword } from "@/lib/auth/hash";
import { stageInfo } from "@/lib/srs";
import type { CardKind, QuizMode } from "@/lib/quiz";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("Falta DIRECT_URL o DATABASE_URL para correr el seed.");
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

const DAY_MS = 24 * 60 * 60 * 1000;
const now = Date.now();

/** PRNG determinístico (mulberry32): mismos datos en cada corrida. */
function makeRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = makeRandom(20260101);
const randInt = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(random() * arr.length)];

type CardSpec = { term: string; meaning: string; example: string; notes?: string; kind: CardKind };
type DeckSpec = { name: string; description: string; color: string; lang: string; cards: CardSpec[] };

const w = (term: string, meaning: string, example: string): CardSpec => ({ term, meaning, example, kind: "word" });
const pv = (term: string, meaning: string, example: string): CardSpec => ({ term, meaning, example, kind: "phrasal_verb" });
const co = (term: string, meaning: string, example: string): CardSpec => ({ term, meaning, example, kind: "collocation" });
const se = (term: string, meaning: string, example: string): CardSpec => ({ term, meaning, example, kind: "sentence" });
const ot = (term: string, meaning: string, example: string): CardSpec => ({ term, meaning, example, kind: "other" });

const DECKS: DeckSpec[] = [
  {
    name: "Phrasal verbs de clase",
    description: "Mazo de ejemplo con phrasal verbs y expresiones comunes.",
    color: "leaf",
    lang: "en-US",
    cards: [
      pv("give up", "rendirse; dejar de intentar", "Don't give up on your dreams."),
      pv("look after", "cuidar a alguien o algo", "She looks after her little brother."),
      pv("run out of", "quedarse sin algo", "We ran out of milk this morning."),
      pv("turn down", "rechazar una oferta o bajar el volumen", "He turned down the job offer."),
      pv("find out", "descubrir; enterarse", "I found out the truth yesterday."),
      pv("get along with", "llevarse bien con alguien", "Do you get along with your neighbours?"),
      pv("put off", "posponer", "Stop putting off your homework."),
      pv("come up with", "se me ocurre; idear", "She came up with a great idea."),
      pv("break down", "descomponerse (una máquina)", "My car broke down on the highway."),
      pv("carry on", "continuar", "Carry on reading, please."),
      pv("set up", "armar, fundar o configurar", "They set up a small business."),
      pv("look forward to", "esperar con ganas", "I look forward to seeing you."),
      pv("pick up", "recoger; aprender algo casualmente", "I picked up some Spanish in Madrid."),
      pv("take off", "despegar; quitarse la ropa", "The plane takes off at noon."),
      pv("work out", "hacer ejercicio; resolverse", "I work out three times a week."),
      co("break the ice", "romper el hielo", "He told a joke to break the ice."),
      co("piece of cake", "muy fácil", "The exam was a piece of cake."),
      co("under the weather", "sentirse mal, algo enfermo", "I'm feeling a bit under the weather."),
      w("reluctant", "reacio; poco dispuesto", "He was reluctant to speak in public."),
      w("thorough", "minucioso; exhaustivo", "She did a thorough job."),
    ],
  },
  {
    name: "Business English",
    description: "Vocabulario para reuniones, mails y presentaciones de trabajo.",
    color: "sky",
    lang: "en-US",
    cards: [
      co("touch base", "ponerse en contacto brevemente", "Let's touch base on Monday."),
      co("bottom line", "el punto principal; el resultado final", "The bottom line is we need more time."),
      co("game changer", "algo que cambia todo", "This new tool is a game changer."),
      co("on the same page", "de acuerdo, con el mismo entendimiento", "Let's make sure we're on the same page."),
      pv("follow up", "hacer un seguimiento", "I'll follow up with an email tomorrow."),
      pv("roll out", "lanzar; implementar", "We're rolling out the new system next week."),
      pv("scale up", "escalar; crecer en volumen", "The startup wants to scale up fast."),
      pv("bring forward", "adelantar (una fecha)", "Can we bring the meeting forward?"),
      w("leverage", "aprovechar; apalancar", "We should leverage our existing network."),
      w("streamline", "simplificar un proceso", "They streamlined the approval process."),
      w("stakeholder", "parte interesada", "All stakeholders approved the plan."),
      w("deadline", "fecha límite", "The deadline is next Friday."),
      w("feasible", "viable; factible", "Is this budget feasible?"),
      se("Could you send me the report by end of day?", "¿Me podés mandar el informe antes de que termine el día?", "Email pidiendo un entregable."),
      se("Let's circle back to this next quarter.", "Retomemos esto el próximo trimestre.", "Frase típica para posponer un tema."),
      ot("ASAP", "lo antes posible (as soon as possible)", "Please reply ASAP."),
      ot("FYI", "para tu información (for your information)", "FYI, the client confirmed the order."),
    ],
  },
  {
    name: "Viajes",
    description: "Frases útiles para el aeropuerto, el hotel y moverte en otro país.",
    color: "sun",
    lang: "en-GB",
    cards: [
      se("Where is the nearest tube station?", "¿Dónde está la estación de metro más cercana?", "Preguntar por el subte en Londres."),
      se("I'd like to check in, please.", "Quisiera hacer el check-in, por favor.", "Al llegar al hotel."),
      se("Is breakfast included in the price?", "¿El desayuno está incluido en el precio?", "Al reservar una habitación."),
      se("Could you call me a taxi?", "¿Me podés pedir un taxi?", "Pedir ayuda en la recepción."),
      co("jet lag", "descompensación horaria", "I still have jet lag from the flight."),
      co("off the beaten path", "poco transitado; no turístico", "We found a café off the beaten path."),
      pv("check out", "dejar el hotel; salir", "We have to check out by 11am."),
      pv("set off", "partir; emprender viaje", "We set off early to avoid traffic."),
      w("itinerary", "itinerario", "Here's our itinerary for the trip."),
      w("luggage", "equipaje", "My luggage didn't arrive."),
      w("layover", "escala", "We have a three-hour layover in Madrid."),
      ot("Cheers!", "¡Gracias! / ¡Salud! (informal, británico)", "Cheers for the help!"),
    ],
  },
  {
    name: "Collocations",
    description: "Combinaciones de palabras que suenan naturales juntas.",
    color: "lilac",
    lang: "en-US",
    cards: [
      co("make a decision", "tomar una decisión", "We need to make a decision soon."),
      co("take a break", "tomarse un descanso", "Let's take a break for ten minutes."),
      co("do the dishes", "lavar los platos", "Whose turn is it to do the dishes?"),
      co("have a look", "echar un vistazo", "Can I have a look at your notes?"),
      co("pay attention", "prestar atención", "Please pay attention to the instructions."),
      co("save time", "ahorrar tiempo", "This shortcut will save time."),
      co("catch a cold", "resfriarse", "I caught a cold last week."),
      co("keep in touch", "mantenerse en contacto", "Let's keep in touch after graduation."),
      co("make progress", "avanzar; progresar", "We're making good progress."),
      co("take responsibility", "asumir responsabilidad", "She took responsibility for the mistake."),
      co("once in a blue moon", "muy de vez en cuando", "We eat out once in a blue moon."),
      co("hit the books", "ponerse a estudiar", "I have to hit the books tonight."),
      co("cut corners", "hacer las cosas a medias para ahorrar", "Don't cut corners on safety."),
      co("as a matter of fact", "de hecho", "As a matter of fact, I was there."),
      co("by the way", "a propósito; dicho sea de paso", "By the way, did you call her?"),
    ],
  },
  {
    name: "Frases útiles",
    description: "Expresiones cortas para el día a día, en francés.",
    color: "rose",
    lang: "fr-FR",
    cards: [
      se("Je voudrais un café, s'il vous plaît.", "Quisiera un café, por favor.", "Pedir algo en un bar."),
      se("Comment ça va ?", "¿Cómo andás?", "Saludo informal."),
      se("Je ne comprends pas.", "No entiendo.", "Cuando no entendés algo."),
      se("Pouvez-vous répéter, s'il vous plaît ?", "¿Puede repetir, por favor?", "Pedir que repitan."),
      w("merci", "gracias", "Merci beaucoup pour votre aide."),
      w("bienvenue", "bienvenido/a", "Bienvenue chez nous !"),
      w("désolé", "lo siento", "Désolé, je suis en retard."),
      ot("À bientôt", "hasta pronto", "Á bientôt, mon ami !"),
      ot("Bon appétit", "buen provecho", "Bon appétit tout le monde !"),
      ot("Ça marche", "dale; hecho (informal)", "On se voit à midi ? – Ça marche !"),
    ],
  },
];

const MODES: QuizMode[] = ["choice", "reverse", "typed", "cloze", "flashcard"];

async function deleteIfExists(email: string) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (user) await prisma.user.delete({ where: { id: user.id } });
}

async function seedDemoUser() {
  const email = "demo@wordgrow.dev";
  await deleteIfExists(email);

  const user = await prisma.user.create({
    data: {
      firstName: "Ada",
      lastName: "Demo",
      email,
      passwordHash: hashPassword("wordgrow123"),
      settings: {
        create: {
          dailyGoal: 15,
          reminderEnabled: true,
          reminderDays: [1, 2, 3, 4, 5],
          reminderTime: "19:30",
          studyDeckScope: "all",
        },
      },
    },
    select: { id: true },
  });

  // Todas las cartas creadas, para armar la sesión a medias y elegir mazos "seleccionados" al final.
  const allCards: { id: number; deckId: number; term: string; meaning: string; kind: CardKind }[] = [];
  const deckIds: number[] = [];

  for (const deckSpec of DECKS) {
    const deck = await prisma.deck.create({
      data: { userId: user.id, name: deckSpec.name, description: deckSpec.description, color: deckSpec.color, lang: deckSpec.lang },
      select: { id: true },
    });
    deckIds.push(deck.id);

    for (const [index, cardSpec] of deckSpec.cards.entries()) {
      // Reparte etapas y estados: nuevas, vencidas, futuras y dominadas, con algunas difíciles.
      const bucket = index % 5;
      const stage = bucket;
      const reps = bucket === 0 ? 0 : randInt(bucket * 2, bucket * 2 + 3);
      const lapses = bucket === 2 || bucket === 3 ? randInt(1, 3) : 0;
      const dueAt =
        bucket === 0
          ? now - randInt(0, 2) * DAY_MS // nueva, sin repasar, ya "vencida" por defecto
          : bucket === 1
            ? now - randInt(0, 5) * DAY_MS // vencida: para repasar hoy
            : now + stageInfo(stage).intervalDays * DAY_MS * randInt(1, 2) - randInt(0, 2) * DAY_MS;
      const lastReviewedAt = reps > 0 ? new Date(now - randInt(1, 20) * DAY_MS) : null;

      const card = await prisma.card.create({
        data: {
          deckId: deck.id,
          term: cardSpec.term,
          meaning: cardSpec.meaning,
          example: cardSpec.example,
          notes: cardSpec.notes ?? "",
          kind: cardSpec.kind,
          createdAt: new Date(now - randInt(20, 90) * DAY_MS),
          progress: { create: { stage, reps, lapses, dueAt: new Date(dueAt), lastReviewedAt } },
        },
        select: { id: true },
      });
      allCards.push({ id: card.id, deckId: deck.id, term: cardSpec.term, meaning: cardSpec.meaning, kind: cardSpec.kind });
    }
  }

  // Historial de repasos de las últimas 12 semanas: la mayoría de los días con actividad,
  // algunos salteados (para el hueco en el heatmap), y una racha activa que incluye hoy.
  const reviews: Prisma.ReviewCreateManyInput[] = [];
  for (let daysAgo = 83; daysAgo >= 0; daysAgo--) {
    const isRecentStreak = daysAgo <= 6; // últimos 7 días: siempre activos, para una racha real.
    if (!isRecentStreak && random() < 0.32) continue; // día salteado.

    const count = isRecentStreak ? randInt(4, 12) : randInt(1, 10);
    for (let i = 0; i < count; i++) {
      const card = pick(allCards);
      const correct = random() < 0.78;
      const hour = randInt(8, 22);
      const minute = randInt(0, 59);
      const reviewedAt = new Date(now - daysAgo * DAY_MS);
      reviewedAt.setHours(hour, minute, 0, 0);
      reviews.push({
        cardId: card.id,
        mode: pick(MODES),
        correct,
        grade: correct ? "correct" : random() < 0.5 ? "unsure" : "wrong",
        responseMs: randInt(800, 12_000),
        reviewedAt,
      });
    }
  }
  await prisma.review.createMany({ data: reviews });

  // Mazos "seleccionados" para las preferencias de estudio: los dos primeros.
  await prisma.userSettings.update({ where: { userId: user.id }, data: { studyDeckScope: "selected", studyDeckIds: deckIds.slice(0, 2) } });

  // Una sesión sin terminar, para probar "Seguí donde quedaste".
  const queueCards = allCards.slice(0, 6);
  const queue = queueCards.map((c) => ({
    cardId: c.id,
    mode: "flashcard" as const,
    lang: "en-US",
    stage: 0,
    term: c.term,
    meaning: c.meaning,
    example: "",
    prompt: c.term,
    answer: c.meaning,
    retry: false,
  }));
  const answered = queue.slice(0, 2).map((item) => ({ item, result: "correct" as const, stageAfter: 1 }));
  await prisma.studySession.create({
    data: {
      userId: user.id,
      deckIds: [],
      source: "due",
      mode: "mixed",
      limit: queue.length,
      items: queue,
      answers: answered,
      position: 2,
    },
  });

  console.log(`✔ ${email} — ${DECKS.length} mazos, ${allCards.length} cartas, ${reviews.length} repasos.`);
}

async function seedFreshUser() {
  const email = "nuevo@wordgrow.dev";
  await deleteIfExists(email);
  await prisma.user.create({
    data: {
      firstName: "Nuevo",
      lastName: "Usuario",
      email,
      passwordHash: hashPassword("wordgrow123"),
      settings: { create: {} },
    },
  });
  console.log(`✔ ${email} — sin mazos, para probar la bienvenida.`);
}

async function main() {
  await seedDemoUser();
  await seedFreshUser();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
