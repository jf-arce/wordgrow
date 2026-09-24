import type { CardInput, DeckInput } from "./schemas";

export const SAMPLE_DECK: DeckInput = {
  name: "Phrasal verbs de clase",
  description: "Mazo de ejemplo con phrasal verbs y expresiones comunes.",
  color: "leaf",
  lang: "en-US",
};

const c = (
  term: string,
  meaning: string,
  example: string,
  kind: CardInput["kind"] = "phrasal_verb",
): CardInput => ({ term, meaning, example, notes: "", kind });

export const SAMPLE_CARDS: CardInput[] = [
  c("give up", "rendirse; dejar de intentar", "Don't give up on your dreams."),
  c("look after", "cuidar a alguien o algo", "She looks after her little brother."),
  c("run out of", "quedarse sin algo", "We ran out of milk this morning."),
  c("turn down", "rechazar una oferta o bajar el volumen", "He turned down the job offer."),
  c("find out", "descubrir; enterarse", "I found out the truth yesterday."),
  c("get along with", "llevarse bien con alguien", "Do you get along with your neighbours?"),
  c("put off", "posponer", "Stop putting off your homework."),
  c("come up with", "se me ocurre; idear", "She came up with a great idea."),
  c("break down", "descomponerse (una máquina)", "My car broke down on the highway."),
  c("carry on", "continuar", "Carry on reading, please."),
  c("set up", "armar, fundar o configurar", "They set up a small business."),
  c("look forward to", "esperar con ganas", "I look forward to seeing you."),
  c("pick up", "recoger; aprender algo casualmente", "I picked up some Spanish in Madrid."),
  c("take off", "despegar; quitarse la ropa", "The plane takes off at noon."),
  c("work out", "hacer ejercicio; resolverse", "I work out three times a week."),
  c("break the ice", "romper el hielo", "He told a joke to break the ice.", "collocation"),
  c("piece of cake", "muy fácil", "The exam was a piece of cake.", "collocation"),
  c("under the weather", "sentirse mal, algo enfermo", "I'm feeling a bit under the weather.", "collocation"),
  c("once in a blue moon", "muy de vez en cuando", "We eat out once in a blue moon.", "collocation"),
  c("hit the books", "ponerse a estudiar", "I have to hit the books tonight.", "collocation"),
  c("cut corners", "hacer las cosas a medias para ahorrar", "Don't cut corners on safety.", "collocation"),
  c("as a matter of fact", "de hecho", "As a matter of fact, I was there.", "collocation"),
  c("by the way", "a propósito; dicho sea de paso", "By the way, did you call her?", "collocation"),
  c("reluctant", "reacio; poco dispuesto", "He was reluctant to speak in public.", "word"),
  c("thorough", "minucioso; exhaustivo", "She did a thorough job.", "word"),
];
