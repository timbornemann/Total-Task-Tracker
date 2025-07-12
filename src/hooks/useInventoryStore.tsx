import React, { useEffect, useState, createContext, useContext } from "react";
import {
  InventoryItem,
  InventoryItemFormData,
  ItemCategory,
  ItemTag,
} from "@/types";

const ITEMS_URL = "/api/inventory/items";
const CATS_URL = "/api/inventory/item-categories";
const TAGS_URL = "/api/inventory/item-tags";

const generateId = () =>
  (crypto as { randomUUID?: () => string }).randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const useInventoryImpl = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [tags, setTags] = useState<ItemTag[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [iRes, cRes, tRes] = await Promise.all([
        fetch(ITEMS_URL),
        fetch(CATS_URL),
        fetch(TAGS_URL),
      ]);
      if (iRes.ok) setItems((await iRes.json()) as InventoryItem[]);
      if (cRes.ok) setCategories((await cRes.json()) as ItemCategory[]);
      if (tRes.ok) setTags((await tRes.json()) as ItemTag[]);
      setLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const save = async () => {
      try {
        await fetch(ITEMS_URL, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(items),
        });
        await fetch(CATS_URL, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(categories),
        });
        await fetch(TAGS_URL, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tags),
        });
      } catch (err) {
        console.error("Error saving inventory", err);
      }
    };
    save();
  }, [items, categories, tags, loaded]);

  const addItem = (data: InventoryItemFormData) => {
    let catId: string | undefined;
    if (data.categoryId) {
      let cat = categories.find((c) => c.name === data.categoryId);
      if (!cat) {
        cat = { id: generateId(), name: data.categoryId };
        setCategories((prev) => [...prev, cat!]);
      }
      catId = cat.id;
    }
    const tagIds = data.tags.map((name) => {
      let t = tags.find((tg) => tg.name === name);
      if (!t) {
        t = { id: generateId(), name };
        setTags((prev) => [...prev, t]);
      }
      return t.id;
    });
    const item: InventoryItem = {
      id: generateId(),
      name: data.name,
      description: data.description,
      quantity: data.quantity,
      categoryId: catId,
      tagIds,
      buyAgain: data.buyAgain,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setItems((prev) => [...prev, item]);
  };

  const updateItem = (
    id: string,
    updates: Partial<InventoryItemFormData & InventoryItem>,
  ) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const next = { ...i } as InventoryItem;
        if (updates.name !== undefined) next.name = updates.name;
        if (updates.description !== undefined) next.description = updates.description;
        if (updates.quantity !== undefined) next.quantity = updates.quantity;
        if (updates.buyAgain !== undefined) next.buyAgain = updates.buyAgain;
        if (updates.categoryId !== undefined) {
          if (updates.categoryId) {
            let cat = categories.find((c) => c.name === updates.categoryId);
            if (!cat) {
              cat = { id: generateId(), name: updates.categoryId };
              setCategories((prevCats) => [...prevCats, cat!]);
            }
            next.categoryId = cat.id;
          } else {
            next.categoryId = undefined;
          }
        }
        if (updates.tags !== undefined || updates.tagIds !== undefined) {
          const names = (updates.tags ?? updates.tagIds ?? []) as string[];
          next.tagIds = names.map((name) => {
            let t = tags.find((tg) => tg.name === name);
            if (!t) {
              t = { id: generateId(), name };
              setTags((prevTags) => [...prevTags, t]);
            }
            return t.id;
          });
        }
        next.updatedAt = new Date();
        return next;
      }),
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return { items, categories, tags, addItem, updateItem, deleteItem };
};

type InventoryStore = ReturnType<typeof useInventoryImpl>;

const InventoryContext = createContext<InventoryStore | null>(null);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useInventoryImpl();
  return <InventoryContext.Provider value={store}>{children}</InventoryContext.Provider>;
};

export const useInventoryStore = () => {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventoryStore must be used within InventoryProvider");
  return ctx;
};
