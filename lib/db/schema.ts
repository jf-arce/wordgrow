/** Migraciones en orden. El índice + 1 es el valor de PRAGMA user_version. */
export const MIGRATIONS: string[] = [
  `
  CREATE TABLE decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT 'leaf',
    lang TEXT NOT NULL DEFAULT 'en-US',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    term TEXT NOT NULL,
    meaning TEXT NOT NULL,
    example TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    kind TEXT NOT NULL DEFAULT 'word'
      CHECK (kind IN ('word','phrase','phrasal_verb','idiom','other')),
    created_at INTEGER NOT NULL,
    UNIQUE (deck_id, term)
  );

  CREATE TABLE card_progress (
    card_id INTEGER PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,
    stage INTEGER NOT NULL DEFAULT 0,
    due_at INTEGER NOT NULL,
    reps INTEGER NOT NULL DEFAULT 0,
    lapses INTEGER NOT NULL DEFAULT 0,
    last_reviewed_at INTEGER
  );

  CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    mode TEXT NOT NULL,
    correct INTEGER NOT NULL,
    grade TEXT NOT NULL,
    response_ms INTEGER NOT NULL DEFAULT 0,
    reviewed_at INTEGER NOT NULL
  );

  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE INDEX idx_cards_deck ON cards(deck_id);
  CREATE INDEX idx_progress_due ON card_progress(due_at);
  CREATE INDEX idx_reviews_at ON reviews(reviewed_at);
  CREATE INDEX idx_reviews_card ON reviews(card_id);
  `,
  `
  -- Cuentas: cada mazo pasa a tener dueño. Los mazos y ajustes que ya existían quedan con
  -- user_id NULL / 0 y los adopta la primera cuenta que se registre (ver app/actions/auth.ts).
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    last_seen_at INTEGER NOT NULL
  );
  CREATE INDEX idx_sessions_user ON sessions(user_id);
  CREATE INDEX idx_sessions_expires ON sessions(expires_at);

  ALTER TABLE decks ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
  CREATE INDEX idx_decks_user ON decks(user_id);

  -- settings tenía PRIMARY KEY (key); SQLite no permite tocar una PK, así que se reconstruye
  -- con (user_id, key) y se preservan los ajustes previos bajo user_id = 0.
  ALTER TABLE settings RENAME TO settings_old;
  CREATE TABLE settings (
    user_id INTEGER NOT NULL DEFAULT 0,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (user_id, key)
  );
  INSERT INTO settings (user_id, key, value) SELECT 0, key, value FROM settings_old;
  DROP TABLE settings_old;
  `,
  `
  -- Progreso de la sesión de estudio en curso: si salís a mitad de camino, se retoma
  -- donde quedaste en vez de reiniciar. Sólo se cierra (finished_at) al responder todo.
  CREATE TABLE study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deck_id INTEGER,
    source TEXT NOT NULL,
    mode TEXT NOT NULL,
    limit_n INTEGER NOT NULL,
    items TEXT NOT NULL,
    answers TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    started_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    finished_at INTEGER
  );
  CREATE INDEX idx_study_sessions_open ON study_sessions(user_id, finished_at);
  `,
  `
  -- Estudiar ahora admite elegir varios mazos a la vez (antes: uno solo o todos).
  -- deck_ids es un CSV de ids ordenados ascendente; '' = todos los mazos. deck_id
  -- queda para no romper filas viejas; se migra a deck_ids acá mismo.
  ALTER TABLE study_sessions ADD COLUMN deck_ids TEXT NOT NULL DEFAULT '';
  UPDATE study_sessions SET deck_ids = CAST(deck_id AS TEXT) WHERE deck_id IS NOT NULL;
  `,
  `
  -- Nueva taxonomía de tipos de carta: word/phrasal_verb/collocation/sentence/other
  -- reemplaza word/phrase/phrasal_verb/idiom/other. SQLite no permite modificar un CHECK
  -- existente, así que se reconstruye la tabla completa. No se renombra "cards" primero
  -- (eso deja a card_progress/reviews apuntando a un nombre que después se borra); se crea
  -- la tabla nueva con otro nombre, se copia, se borra la vieja y recién ahí se renombra,
  -- para que las FK de las tablas hijas nunca dejen de resolver a un "cards" válido.
  -- legacy_kind guarda el valor original de las filas migradas (idiom/phrase), para no
  -- perder esa clasificación de un plumazo aunque no se muestre todavía en la UI.
  CREATE TABLE cards_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    term TEXT NOT NULL,
    meaning TEXT NOT NULL,
    example TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    kind TEXT NOT NULL DEFAULT 'word'
      CHECK (kind IN ('word','phrasal_verb','collocation','sentence','other')),
    legacy_kind TEXT,
    created_at INTEGER NOT NULL,
    UNIQUE (deck_id, term)
  );

  INSERT INTO cards_new (id, deck_id, term, meaning, example, notes, kind, legacy_kind, created_at)
  SELECT
    id, deck_id, term, meaning, example, notes,
    CASE kind WHEN 'idiom' THEN 'collocation' WHEN 'phrase' THEN 'collocation' ELSE kind END,
    CASE WHEN kind IN ('idiom','phrase') THEN kind ELSE NULL END,
    created_at
  FROM cards;

  DROP TABLE cards;
  ALTER TABLE cards_new RENAME TO cards;

  CREATE INDEX idx_cards_deck ON cards(deck_id);
  `,
  `
  ALTER TABLE study_sessions ADD COLUMN current_answer TEXT;
  UPDATE study_sessions
  SET current_answer = json_remove(json_extract(answers, '$[' || position || ']'), '$.item')
  WHERE json_extract(answers, '$[' || position || '].item.cardId') = json_extract(items, '$[' || position || '].cardId');
  `,
];

/** Índices (0-based, mismo orden que `MIGRATIONS`) de migraciones que reconstruyen una
 * tabla referenciada por foreign keys y por eso necesitan `PRAGMA foreign_keys = OFF`
 * ANTES de abrir la transacción — dentro de una transacción ya iniciada ese pragma no
 * tiene efecto (comportamiento documentado de SQLite). Ver `migrate()` en `./index.ts`. */
export const MIGRATIONS_NEEDING_FK_OFF = new Set<number>([4]);
