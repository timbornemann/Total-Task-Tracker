import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Note } from "@/types";
import { useSettings } from "@/hooks/useSettings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MarkdownEditor from "./MarkdownEditor";
import { Label } from "@/components/ui/label";

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: Omit<Note, "id" | "createdAt" | "updatedAt" | "order" | "pinned">,
  ) => void;
  note?: Note;
}

const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  note,
}) => {
  const { t } = useTranslation();
  const { colorPalette } = useSettings();
  const [formData, setFormData] = useState({
    title: "",
    text: "",
    color: 3,
  });

  const colorOptions = colorPalette;

  useEffect(() => {
    if (!isOpen) return;
    if (note) {
      setFormData({ title: note.title, text: note.text, color: note.color });
    } else {
      setFormData({ title: "", text: "", color: 3 });
    }
  }, [isOpen, note, colorPalette]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSave(formData);
      onClose();
    }
  };

  const handleChange = (
    field: "title" | "text" | "color",
    value: string | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {note ? t("noteModal.editTitle") : t("noteModal.newTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">{t("noteModal.title")}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="text">{t("noteModal.text")}</Label>
            <MarkdownEditor
              value={formData.text}
              onChange={(val) => handleChange("text", val)}
              rows={5}
            />
          </div>
          <div>
            <Label>{t("noteModal.color")}</Label>
            <div className="flex space-x-2 mt-2">
              {colorOptions.map((color, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === idx
                      ? "border-gray-800 scale-110"
                      : "border-gray-300 hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleChange("color", idx)}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">
              {note ? t("common.save") : t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NoteModal;
