import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import InventoryModal from "@/components/InventoryModal";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

const InventoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { items, categories, tags, deleteItem, updateItem } =
    useInventoryStore();
  const item = items.find((i) => i.id === id);
  const category = categories.find((c) => c.id === item?.categoryId);
  const tagNames = item?.tagIds
    .map((tagId) => tags.find((t) => t.id === tagId)?.name)
    .filter(Boolean) as string[];
  const [open, setOpen] = useState(false);

  if (!item) return <div className="p-4">{t("common.notFound")}</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={item.name} onHomeClick={() => navigate("/inventory")} />
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/inventory")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> {t("common.back")}
        </Button>
        <div className="space-y-2">
          <p>
            <strong>{t("inventory.description")}:</strong>{" "}
            {item.description || "-"}
          </p>
          <div className="flex items-center space-x-2">
            <strong>{t("inventory.quantity")}:</strong>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                updateItem(item.id, {
                  quantity: Math.max(0, item.quantity - 1),
                })
              }
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span>{item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                updateItem(item.id, { quantity: item.quantity + 1 })
              }
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {category && (
            <p>
              <strong>{t("inventory.category")}:</strong> {category.name}
            </p>
          )}
          {tagNames.length > 0 && (
            <p>
              <strong>{t("inventory.tags")}:</strong> {tagNames.join(", ")}
            </p>
          )}
          <p>
            <strong>{t("inventory.buyAgain")}:</strong>{" "}
            {item.buyAgain ? t("common.yes") : t("common.no")}
          </p>
        </div>
        <div className="space-x-2">
          <Button onClick={() => setOpen(true)}>{t("common.edit")}</Button>
          <Button
            variant="destructive"
            onClick={() => {
              deleteItem(item.id);
              navigate("/inventory");
            }}
          >
            {t("common.delete")}
          </Button>
        </div>
      </div>
      <InventoryModal
        isOpen={open}
        onClose={() => setOpen(false)}
        item={item}
        onSave={(data) =>
          updateItem(item.id, {
            name: data.name,
            description: data.description,
            quantity: data.quantity,
            buyAgain: data.buyAgain,
            categoryId: data.categoryId,
            tags: data.tags,
          })
        }
      />
    </div>
  );
};

export default InventoryDetailPage;
