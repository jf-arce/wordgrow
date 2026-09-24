import type { QuizItem } from "@/lib/quiz";
import type { Result } from "@/lib/srs";

export type QueueItem = QuizItem & { retry: boolean };

export type Answered = {
  result: Result;
  stageAfter: number;
  selectedId?: number;
  typed?: string;
  close?: boolean;
};

export type FirstAttempt = {
  item: QuizItem;
  result: Result;
  stageAfter: number;
  selectedId?: number;
  typed?: string;
  close?: boolean;
};
