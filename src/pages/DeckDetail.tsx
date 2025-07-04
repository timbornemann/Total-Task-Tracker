import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import FlashcardModal from "@/components/FlashcardModal";
import { useFlashcardStore } from "@/hooks/useFlashcardStore";
import { Plus, Pencil, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";

const DeckDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const {
    decks,
    addFlashcard,
    updateFlashcard,
    deleteFlashcard,
    countCardsForDeck,
    countDueCardsForDeck,
    flashcards,
  } = useFlashcardStore();
  const deck = decks.find((d) => d.id === deckId);
  const cards = flashcards.filter((c) => c.deckId === deckId);
  const totalCount = countCardsForDeck(deckId!);
  const dueCount = countDueCardsForDeck(deckId!);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);

  if (!deck) return <div className="p-4">{t("deckDetail.notFound")}</div>;

  const handleSave = (data: {
    front: string;
    back: string;
    deckId: string;
  }) => {
    const payload = { ...data, deckId: deckId! };
    if (editingIndex !== null) {
      const card = cards[editingIndex];
      updateFlashcard(card.id, payload);
      setEditingIndex(null);
    } else {
      addFlashcard(payload);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        title={deck.name}
        onHomeClick={() => navigate("/flashcards/manage")}
      />
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t("deckDetail.dueProgress", { due: dueCount, total: totalCount })}
          </span>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> {t("deckDetail.newCard")}
          </Button>
        </div>
        {cards.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("deckDetail.noCards")}
          </p>
        ) : (
          <div className="space-y-4">
            {cards.map((card, index) => (
              <Card key={card.id}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    {t("deckDetail.cardNumber", { number: index + 1 })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="font-medium">{card.front}</div>
                  <div className="text-sm text-muted-foreground">
                    {card.back}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingIndex(index);
                      setIsModalOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteCardId(card.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      <FlashcardModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingIndex(null);
        }}
        onSave={handleSave}
        decks={decks}
        card={editingIndex !== null ? cards[editingIndex] : undefined}
      />
      <ConfirmDialog
        open={!!deleteCardId}
        onOpenChange={(o) => !o && setDeleteCardId(null)}
        title={t("deckDetail.deleteConfirm")}
        onConfirm={() => {
          if (deleteCardId) {
            deleteFlashcard(deleteCardId);
            setDeleteCardId(null);
          }
        }}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
      />
    </div>
  );
};

export default DeckDetailPage;
