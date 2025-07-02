import { useMemo } from "react";
import { useFlashcardStore } from "./useFlashcardStore";
import i18n from "@/lib/i18n";

export interface FlashcardStats {
  totalCards: number;
  dueCards: number;
  averageInterval: number;
  difficultyCounts: {
    easy: number;
    medium: number;
    hard: number;
  };
  upcomingDue: { date: string; count: number }[];
  deckStats: { deckId: string; deckName: string; total: number; due: number }[];
}

export const useFlashcardStatistics = (): FlashcardStats => {
  const { flashcards, decks } = useFlashcardStore();

  return useMemo(() => {
    const locale = i18n.language === "de" ? "de-DE" : "en-US";
    const totalCards = flashcards.length;
    const dueCards = flashcards.filter(
      (c) => new Date(c.dueDate) <= new Date(),
    ).length;
    const averageInterval =
      totalCards > 0
        ? flashcards.reduce((sum, c) => sum + c.interval, 0) / totalCards
        : 0;

    const difficultyCounts = flashcards.reduce(
      (acc, c) => {
        acc.easy += c.easyCount;
        acc.medium += c.mediumCount;
        acc.hard += c.hardCount;
        return acc;
      },
      { easy: 0, medium: 0, hard: 0 },
    );

    const upcomingDue: { date: string; count: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      const count = flashcards.filter(
        (c) => c.dueDate.toISOString().split("T")[0] === key,
      ).length;
      upcomingDue.push({
        date: d.toLocaleDateString(locale, { month: "short", day: "numeric" }),
        count,
      });
    }

    const deckStats = decks.map((deck) => {
      const cards = flashcards.filter((c) => c.deckId === deck.id);
      const total = cards.length;
      const due = cards.filter((c) => new Date(c.dueDate) <= new Date()).length;
      return { deckId: deck.id, deckName: deck.name, total, due };
    });

    return {
      totalCards,
      dueCards,
      averageInterval,
      difficultyCounts,
      upcomingDue,
      deckStats,
    };
  }, [flashcards, decks]);
};
