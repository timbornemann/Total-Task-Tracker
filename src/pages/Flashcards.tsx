import React, { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useFlashcardStore } from "@/hooks/useFlashcardStore";
import { useSettings } from "@/hooks/useSettings";
import { shuffleArray } from "@/utils/shuffle";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";

const FlashcardsPage: React.FC = () => {
  const { flashcards, decks, rateFlashcard } = useFlashcardStore();
  const { t } = useTranslation();
  const { flashcardTimer, flashcardSessionSize, flashcardDefaultMode } =
    useSettings();
  const [selectedDecks, setSelectedDecks] = useState<string[]>([]);
  const [randomMode, setRandomMode] = useState(
    flashcardDefaultMode === "random",
  );
  const [trainingMode, setTrainingMode] = useState(
    flashcardDefaultMode === "training",
  );
  const [typingMode, setTypingMode] = useState(
    flashcardDefaultMode === "typing",
  );
  const [timedMode, setTimedMode] = useState(flashcardDefaultMode === "timed");
  const [useSpaced, setUseSpaced] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const TIMER_DURATION = flashcardTimer;
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [sessionCards, setSessionCards] = useState<typeof flashcards>([]);
  const [remainingCards, setRemainingCards] = useState<typeof flashcards>([]);
  const [summary, setSummary] = useState<
    Record<string, { easy: number; medium: number; hard: number }>
  >({});
  const [showSummary, setShowSummary] = useState(false);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const mode = typingMode
    ? "typing"
    : trainingMode
      ? "training"
      : randomMode
        ? "random"
        : timedMode
          ? "timed"
          : "spaced";

  const modeDescription = useMemo(() => {
    if (mode === "typing") {
      return t(
        useSpaced
          ? "flashcardsPage.description.typingSpaced"
          : "flashcardsPage.description.typing",
      );
    }
    if (mode === "timed") {
      return t(
        useSpaced
          ? "flashcardsPage.description.timedSpaced"
          : "flashcardsPage.description.timed",
      );
    }
    return t(`flashcardsPage.description.${mode}`);
  }, [mode, useSpaced, t]);
  const handleModeChange = (
    value: "spaced" | "training" | "random" | "typing" | "timed",
  ) => {
    setRandomMode(value === "random");
    setTrainingMode(value === "training");
    setTypingMode(value === "typing");
    setTimedMode(value === "timed");
    setTimerStarted(false);
    setTimerPaused(false);
    setTimerActive(false);
    setUseSpaced(true);
    setIndex(0);
    setShowBack(false);
    setAnswer("");
    setChecked(false);
  };

  useEffect(() => {
    if (decks.length > 0 && selectedDecks.length === 0) {
      setSelectedDecks(decks.map((d) => d.id));
    }
  }, [decks, selectedDecks.length]);

  const filtered = useMemo(
    () => flashcards.filter((c) => selectedDecks.includes(c.deckId)),
    [flashcards, selectedDecks],
  );
  const dueCards = useMemo(
    () => filtered.filter((c) => new Date(c.dueDate) <= new Date()),
    [filtered],
  );

  const nonSpaced = !useSpaced && (typingMode || timedMode);

  const algorithmAffected = !(trainingMode || randomMode || nonSpaced);

  useEffect(() => {
    if (trainingMode) {
      const all = shuffleArray(filtered);
      setSessionCards(all.slice(0, flashcardSessionSize));
      setRemainingCards(all.slice(flashcardSessionSize));
      setIndex(0);
      setSummary({});
      setShowSummary(false);
    }
  }, [filtered, trainingMode]);

  const cards = useMemo(() => {
    if (randomMode || nonSpaced) {
      return shuffleArray(filtered);
    }
    return dueCards;
  }, [filtered, dueCards, randomMode, nonSpaced, shuffleKey]);

  const current = trainingMode ? sessionCards[index] : cards[index];

  const overallTotalCards = useMemo(
    () => (trainingMode ? filtered.length : cards.length),
    [trainingMode, filtered.length, cards.length],
  );

  const completedCards = useMemo(
    () =>
      trainingMode
        ? filtered.length - remainingCards.length - sessionCards.length
        : index,
    [
      trainingMode,
      filtered.length,
      remainingCards.length,
      sessionCards.length,
      index,
    ],
  );

  const progressValue =
    overallTotalCards > 0
      ? ((trainingMode ? completedCards + index : index) / overallTotalCards) *
        100
      : 0;

  const sessionTotalCards = trainingMode
    ? sessionCards.length
    : overallTotalCards;
  const overallCardNumber = trainingMode
    ? completedCards + index + 1
    : index + 1;

  useEffect(() => {
    if (!current) {
      setTimeLeft(0);
      setTimerActive(false);
      return;
    }
    if (timedMode) {
      setTimeLeft(TIMER_DURATION);
      setTimerPaused(false);
      setTimerActive(timerStarted);
    } else {
      setTimerActive(false);
    }
  }, [current, timedMode, timerStarted]);

  useEffect(() => {
    if (!timedMode) return;
    setTimerActive(timerStarted && !timerPaused);
  }, [timerPaused, timerStarted, timedMode]);

  useEffect(() => {
    if (!timedMode || !timerActive || timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [timeLeft, timedMode, timerActive]);

  useEffect(() => {
    if (timedMode && timerActive && timeLeft === 0) {
      handleRate("hard");
      setTimeLeft(-1);
      setTimerActive(false);
    }
  }, [timeLeft, timedMode, timerActive]);

  useEffect(() => {
    if (
      !trainingMode &&
      randomMode &&
      index >= cards.length &&
      cards.length > 0
    ) {
      setShowDone(true);
    } else if (nonSpaced && index >= cards.length && cards.length > 0) {
      setShowSummary(true);
    }
  }, [index, randomMode, cards.length, trainingMode, nonSpaced]);

  const handleRate = (d: "easy" | "medium" | "hard") => {
    if (!current) return;
    if (trainingMode) {
      setSummary((prev) => {
        const entry = prev[current.id] || { easy: 0, medium: 0, hard: 0 };
        return { ...prev, [current.id]: { ...entry, [d]: entry[d] + 1 } };
      });
      const cards = [...sessionCards];
      cards.splice(index, 1);
      if (d !== "easy") cards.push(current);
      if (cards.length === 0) {
        setSessionCards([]);
        setShowSummary(true);
      } else {
        setSessionCards(cards);
        setIndex((i) => (i >= cards.length ? 0 : i));
      }
      setShowBack(false);
      return;
    }
    if (nonSpaced) {
      setSummary((prev) => {
        const entry = prev[current.id] || { easy: 0, medium: 0, hard: 0 };
        return { ...prev, [current.id]: { ...entry, [d]: entry[d] + 1 } };
      });
    } else if (!randomMode) {
      rateFlashcard(
        current.id,
        d,
        typingMode ? (isCorrect ?? false) : undefined,
      );
    }
    setShowBack(false);
    setAnswer("");
    setChecked(false);
    setIsCorrect(null);
    setTimerActive(false);
    setTimerPaused(false);
    setIndex((i) => i + 1);
  };

  const handleRestart = () => {
    if (trainingMode) {
      const all = shuffleArray(filtered);
      setSessionCards(all.slice(0, flashcardSessionSize));
      setRemainingCards(all.slice(flashcardSessionSize));
      setIndex(0);
      setShowBack(false);
      setSummary({});
      setShowSummary(false);
    } else {
      setShowDone(false);
      setIndex(0);
      setShowBack(false);
      setShuffleKey((k) => k + 1);
      if (nonSpaced) {
        setSummary({});
        setShowSummary(false);
      }
    }
    setAnswer("");
    setChecked(false);
    setIsCorrect(null);
    setTimerActive(false);
    setTimerPaused(false);
    setTimerStarted(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={t("flashcardsPage.title")} />
      <div className="max-w-md mx-auto py-8 px-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label className="text-sm">{t("flashcardsPage.mode")}:</Label>
            <Select value={mode} onValueChange={handleModeChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("flashcardsPage.mode")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spaced">
                  {t("flashcardsPage.spaced")}
                </SelectItem>
                <SelectItem value="training">
                  {t("flashcardsPage.training")}
                </SelectItem>
                <SelectItem value="random">
                  {t("flashcardsPage.random")}
                </SelectItem>
                <SelectItem value="typing">
                  {t("flashcardsPage.typing")}
                </SelectItem>
                <SelectItem value="timed">
                  {t("flashcardsPage.timed")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            {decks.map((deck) => (
              <div key={deck.id} className="flex items-center space-x-2">
                <Checkbox
                  id={deck.id}
                  checked={selectedDecks.includes(deck.id)}
                  onCheckedChange={(checked) => {
                    setSelectedDecks((prev) =>
                      checked
                        ? [...prev, deck.id]
                        : prev.filter((id) => id !== deck.id),
                    );
                    setIndex(0);
                  }}
                />
                <Label htmlFor={deck.id}>{deck.name}</Label>
              </div>
            ))}
          </div>
          {(typingMode || timedMode) && (
            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="useSpaced">{t("flashcardsPage.useSpaced")}</Label>
              <Switch
                id="useSpaced"
                checked={useSpaced}
                onCheckedChange={setUseSpaced}
              />
            </div>
          )}
        </div>
        {!current ? (
          <p className="text-sm text-muted-foreground">
            {t("flashcardsPage.noDue")}
          </p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {decks.find((d) => d.id === current.deckId)?.name}
              </CardTitle>
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    {t("flashcardsPage.cardProgress", {
                      number: index + 1,
                      total: sessionTotalCards,
                    })}
                    {trainingMode && (
                      <>
                        {" "}
                        (
                        {t("flashcardsPage.cardProgress", {
                          number: overallCardNumber,
                          total: overallTotalCards,
                        })}
                        )
                      </>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(progressValue)}%
                  </span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>
            </CardHeader>
            <CardContent>
              {timedMode && timerStarted && (
                <div className="flex justify-center items-center space-x-2 mb-4">
                  <div className="text-2xl font-bold text-destructive text-center">
                    {Math.max(timeLeft, 0)}
                  </div>
                  {timerPaused ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTimerPaused(false)}
                    >
                      {t("flashcardsPage.continue")}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTimerPaused(true)}
                    >
                      {t("flashcardsPage.pause")}
                    </Button>
                  )}
                </div>
              )}
              {typingMode ? (
                <div
                  className={`space-y-4 py-8 ${timedMode && timerPaused ? "blur-sm select-none" : ""}`}
                >
                  <div className="text-center text-lg">{current.front}</div>
                  {showBack ? (
                    <>
                      <div className="text-center">{current.back}</div>
                      <div
                        className={`text-sm text-center ${isCorrect ? "text-accent" : "text-destructive"}`}
                      >
                        {isCorrect
                          ? t("flashcardsPage.correct")
                          : t("flashcardsPage.wrong")}
                      </div>
                    </>
                  ) : (
                    <Input
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                    />
                  )}
                </div>
              ) : (
                <div
                  className={`text-center text-lg cursor-pointer py-12 ${timedMode && timerPaused ? "blur-sm select-none cursor-default" : ""}`}
                  onClick={() => !timerPaused && setShowBack((b) => !b)}
                >
                  {showBack ? (
                    <div className="space-y-2">
                      <div>{current.front}</div>
                      <div>{current.back}</div>
                    </div>
                  ) : (
                    current.front
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {typingMode ? (
                !checked ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const correct =
                        answer.trim().toLowerCase() ===
                        current.back.trim().toLowerCase();
                      setIsCorrect(correct);
                      setChecked(true);
                      setShowBack(true);
                    }}
                  >
                    {t("flashcardsPage.check")}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleRate("hard")}
                    >
                      {t("flashcardsPage.hard")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRate("medium")}
                    >
                      {t("flashcardsPage.medium")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRate("easy")}
                    >
                      {t("flashcardsPage.easy")}
                    </Button>
                  </>
                )
              ) : randomMode && !trainingMode ? (
                <Button variant="outline" onClick={() => handleRate("easy")}>
                  {t("flashcardsPage.nextCard")}
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => handleRate("hard")}>
                    {t("flashcardsPage.hard")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleRate("medium")}
                  >
                    {t("flashcardsPage.medium")}
                  </Button>
                  <Button variant="outline" onClick={() => handleRate("easy")}>
                    {t("flashcardsPage.easy")}
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        )}
        <p className="text-sm text-muted-foreground">{modeDescription}</p>
      </div>
      <AlertDialog open={timedMode && !timerStarted && !!current}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("flashcardsPage.timerStart")}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setTimerStarted(true)}>
              {t("flashcardsPage.start")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={showSummary}
        onOpenChange={(open) => {
          if (!open) {
            if (trainingMode) {
              if (remainingCards.length === 0) {
                handleRestart();
              } else {
                const next = remainingCards.slice(0, flashcardSessionSize);
                setSessionCards(next);
                setRemainingCards(remainingCards.slice(flashcardSessionSize));
                setIndex(0);
                setShowBack(false);
                setShowSummary(false);
              }
            } else {
              handleRestart();
            }
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {trainingMode
                ? t("flashcardsPage.trainingDone")
                : t("flashcardsPage.sessionDone")}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="max-h-60 overflow-y-auto space-y-2 my-2 text-sm">
            {Object.entries(summary).map(([id, counts]) => {
              const card = flashcards.find((c) => c.id === id);
              return (
                <div key={id}>
                  <div className="font-medium">{card?.front}</div>
                  <div>
                    {t("flashcardsPage.easy")}: {counts.easy},{" "}
                    {t("flashcardsPage.medium")}: {counts.medium},{" "}
                    {t("flashcardsPage.hard")}: {counts.hard}
                  </div>
                </div>
              );
            })}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSummary(false)}>
              {t("flashcardsPage.continue")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={showDone}
        onOpenChange={(open) => {
          if (!open) handleRestart();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("flashcardsPage.allDone")}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleRestart}>
              {t("flashcardsPage.continue")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FlashcardsPage;
