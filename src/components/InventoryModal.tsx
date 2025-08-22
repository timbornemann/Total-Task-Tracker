import React, { useEffect, useState } from "react";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { InventoryItem, InventoryItemFormData } from "@/types";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: InventoryItemFormData) => void;
  item?: InventoryItem;
}

const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  item,
}) => {
  const { t } = useTranslation();
  const { categories, tags } = useInventoryStore();
  const [form, setForm] = useState<InventoryItemFormData>({
    name: "",
    description: "",
    quantity: 1,
    categoryId: "",
    tags: [],
    buyAgain: false,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (item) {
      setForm({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        categoryId:
          categories.find((c) => c.id === item.categoryId)?.name || "",
        tags: item.tagIds.map(
          (id) => tags.find((t) => t.id === id)?.name || "",
        ),
        buyAgain: item.buyAgain,
      });
    } else {
      setForm({
        name: "",
        description: "",
        quantity: 1,
        categoryId: "",
        tags: [],
        buyAgain: false,
      });
    }
  }, [item, isOpen, tags, categories]);

  const handleChange = (
    field: keyof InventoryItemFormData,
    value: string | number | boolean | string[],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      tags: form.tags.filter((t) => t.trim().length > 0),
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {item
              ? t("inventoryModal.editTitle")
              : t("inventoryModal.newTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t("inventoryModal.name")}</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="description">
              {t("inventoryModal.description")}
            </Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="quantity">{t("inventoryModal.quantity")}</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={form.quantity}
              onChange={(e) => handleChange("quantity", Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="category">{t("inventoryModal.category")}</Label>
            <Input
              list="category-list"
              id="category"
              value={form.categoryId}
              onChange={(e) => handleChange("categoryId", e.target.value)}
            />
            <datalist id="category-list">
              {categories.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>
          <div>
            <Label htmlFor="tags">{t("inventoryModal.tags")}</Label>
            <Input
              list="tag-list"
              id="tags"
              value={form.tags.join(", ")}
              onChange={(e) =>
                handleChange("tags", e.target.value.split(/,\s*/))
              }
            />
            <datalist id="tag-list">
              {tags.map((t) => (
                <option key={t.id} value={t.name} />
              ))}
            </datalist>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="buy"
              checked={form.buyAgain}
              onCheckedChange={(v) => handleChange("buyAgain", !!v)}
            />
            <Label htmlFor="buy">{t("inventoryModal.buyAgain")}</Label>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">
              {item ? t("common.save") : t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryModal;
