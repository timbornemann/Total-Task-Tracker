import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import InventoryModal from "@/components/InventoryModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

const InventoryPage: React.FC = () => {
  const { items, categories, tags, addItem } = useInventoryStore();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const filtered = items.filter((i) => {
    const text = `${i.name} ${i.description}`.toLowerCase();
    const catName = categories.find((c) => c.id === i.categoryId)?.name || "";
    const tagNames = i.tagIds
      .map((id) => tags.find((t) => t.id === id)?.name)
      .filter(Boolean)
      .join(" ");
    if (catFilter !== "all" && i.categoryId !== catFilter) return false;
    if (tagFilter !== "all" && !i.tagIds.includes(tagFilter)) return false;
    return (
      text.includes(search.toLowerCase()) ||
      catName.toLowerCase().includes(search.toLowerCase()) ||
      tagNames.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={t("inventory.title")} />
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <Input
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("inventory.categoryFilter")}/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.none")}</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("inventory.tagFilter")}/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.none")}</SelectItem>
              {tags.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setOpen(true)}>{t("inventory.newItem")}</Button>
        </div>
        <ul className="divide-y">
          {filtered.map((item) => (
            <li
              key={item.id}
              className={`py-2 flex justify-between ${item.buyAgain ? "font-semibold text-destructive" : ""}`}
            >
              <Link to={`/inventory/${item.id}`}>{item.name}</Link>
              <span>{item.quantity}</span>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="py-4 text-center text-muted-foreground">
              {t("inventory.none")}
            </li>
          )}
        </ul>
      </div>
      <InventoryModal isOpen={open} onClose={() => setOpen(false)} onSave={addItem} />
    </div>
  );
};

export default InventoryPage;
