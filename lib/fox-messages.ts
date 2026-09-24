const messages = {
  correct: [
    "¡Esa ya la tenés!",
    "¡Bien ahí! Una palabra más para vos.",
    "¡Vamos! Tu práctica se nota.",
    "¡La encontraste! Seguimos.",
    "¡Buen trabajo! Paso a paso.",
    "¡Así se hace! Sigamos practicando.",
  ],
  wrong: [
    "No pasa nada, la practicamos de nuevo.",
    "Equivocarse también es parte de aprender.",
    "Mirá la respuesta y probemos otra vez.",
    "Esta necesita un poquito más de práctica.",
    "Vamos de a poco. Todavía podemos repasarla.",
    "Un intento más, una oportunidad de aprender.",
  ],
  unsure: [
    "La repasamos juntos en un rato.",
    "Tomate tu tiempo, no hay apuro.",
    "Detectar una duda también ayuda a aprender.",
    "Volver a verla te va a ayudar.",
    "Un repaso más para ganar confianza.",
    "Seguimos practicando a tu ritmo.",
  ],
  perfect: [
    "¡No se te escapó ninguna!",
    "¡Todas a la primera! Gran trabajo.",
    "¡Una ronda para celebrar!",
    "¡Pleno de aciertos! La práctica suma.",
    "¡Te salió redonda esta sesión!",
    "¡Qué buena ronda! Disfrutá este logro.",
  ],
  complete: [
    "¡Un paso más! Cada repaso cuenta.",
    "Bien por hacerte un rato para aprender.",
    "Lo difícil de hoy lo seguimos practicando.",
    "¡Sesión terminada! Seguimos creciendo.",
    "Sumaste práctica, y eso vale.",
    "Guardá lo aprendido. Nos vemos en el próximo repaso.",
  ],
  retry: [
    "Esta ronda costó. Vamos de a una.",
    "Hoy encontramos qué palabras repasar.",
    "No hace falta que salga todo de una.",
    "Podés volver a intentarlo a tu ritmo.",
    "Un resultado no define lo que podés aprender.",
    "Respirá un poquito. Seguimos cuando quieras.",
  ],
};

export function foxMessage(occasion: keyof typeof messages, index: number) {
  return messages[occasion][index] ?? messages[occasion][0];
}

/** Se elige al responder o terminar, nunca durante el render. */
export function randomFoxMessageIndex() {
  return Math.floor(Math.random() * 6);
}
