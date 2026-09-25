-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CardKind" AS ENUM ('word', 'phrasal_verb', 'collocation', 'sentence', 'other');

-- CreateEnum
CREATE TYPE "QuizMode" AS ENUM ('choice', 'reverse', 'typed', 'cloze', 'flashcard');

-- CreateEnum
CREATE TYPE "StudyMode" AS ENUM ('mixed', 'choice', 'reverse', 'typed', 'cloze', 'flashcard');

-- CreateEnum
CREATE TYPE "StudySource" AS ENUM ('due', 'all', 'hard', 'new');

-- CreateEnum
CREATE TYPE "ReviewGrade" AS ENUM ('correct', 'unsure', 'wrong');

-- CreateEnum
CREATE TYPE "ThemePref" AS ENUM ('system', 'light', 'dark');

-- CreateEnum
CREATE TYPE "DeckScope" AS ENUM ('all', 'selected');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMPTZ(3),
    "refresh_token_expires_at" TIMESTAMPTZ(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decks" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT 'leaf',
    "lang" TEXT NOT NULL DEFAULT 'en-US',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" SERIAL NOT NULL,
    "deck_id" INTEGER NOT NULL,
    "term" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "example" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "kind" "CardKind" NOT NULL DEFAULT 'word',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_progress" (
    "card_id" INTEGER NOT NULL,
    "stage" INTEGER NOT NULL DEFAULT 0,
    "due_at" TIMESTAMPTZ(3) NOT NULL,
    "reps" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "last_reviewed_at" TIMESTAMPTZ(3),

    CONSTRAINT "card_progress_pkey" PRIMARY KEY ("card_id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "mode" "QuizMode" NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "grade" "ReviewGrade" NOT NULL,
    "response_ms" INTEGER NOT NULL DEFAULT 0,
    "reviewed_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "user_id" TEXT NOT NULL,
    "daily_goal" INTEGER NOT NULL DEFAULT 20,
    "tts_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.9,
    "autoplay_audio" BOOLEAN NOT NULL DEFAULT false,
    "theme" "ThemePref" NOT NULL DEFAULT 'system',
    "tts_voice" TEXT NOT NULL DEFAULT '',
    "study_source" "StudySource" NOT NULL DEFAULT 'due',
    "study_mode" "StudyMode" NOT NULL DEFAULT 'mixed',
    "study_limit" INTEGER NOT NULL DEFAULT 20,
    "study_deck_scope" "DeckScope" NOT NULL DEFAULT 'all',
    "study_deck_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "reminder_enabled" BOOLEAN NOT NULL DEFAULT false,
    "reminder_days" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "reminder_time" TEXT NOT NULL DEFAULT '19:00',

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "study_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "deck_ids" INTEGER[],
    "source" "StudySource" NOT NULL,
    "mode" "StudyMode" NOT NULL,
    "limit" INTEGER NOT NULL,
    "items" JSONB NOT NULL,
    "answers" JSONB NOT NULL,
    "current_answer" JSONB,
    "position" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "finished_at" TIMESTAMPTZ(3),

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_id_account_id_key" ON "accounts"("provider_id", "account_id");

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

-- CreateIndex
CREATE INDEX "decks_user_id_created_at_idx" ON "decks"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "cards_deck_id_idx" ON "cards"("deck_id");

-- CreateIndex
CREATE UNIQUE INDEX "cards_deck_id_term_key" ON "cards"("deck_id", "term");

-- CreateIndex
CREATE INDEX "card_progress_due_at_idx" ON "card_progress"("due_at");

-- CreateIndex
CREATE INDEX "reviews_reviewed_at_idx" ON "reviews"("reviewed_at");

-- CreateIndex
CREATE INDEX "reviews_card_id_idx" ON "reviews"("card_id");

-- CreateIndex
CREATE INDEX "study_sessions_user_id_finished_at_idx" ON "study_sessions"("user_id", "finished_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decks" ADD CONSTRAINT "decks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_progress" ADD CONSTRAINT "card_progress_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
