import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Deck } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  deck?: Deck;
}

const DeckModal: React.FC<DeckModalProps> = ({
  isOpen,
  onClose,
  onSave,
  deck,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setName(deck ? deck.name : "");
  }, [isOpen, deck]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {deck ? t("deckModal.editTitle") : t("deckModal.newTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t("deckModal.name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("deckModal.placeholderName")}
              required
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">
              {deck ? t("common.save") : t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeckModal;
