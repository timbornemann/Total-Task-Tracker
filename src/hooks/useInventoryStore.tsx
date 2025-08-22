import React, {
  useEffect,
  useState,
  createContext,
  useContext,
  useRef,
} from "react";
import {
  InventoryItem,
  InventoryItemFormData,
  ItemCategory,
  ItemTag,
} from "@/types";
import {
  loadOfflineData,
  updateOfflineData,
  syncWithServer,
} from "@/utils/offline";
import { mergeLists } from "@/utils/sync";

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
  const [initialized, setInitialized] = useState(false);
  const lastDataRef = useRef("");
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const offline = loadOfflineData();
      if (offline) {
        setItems(offline.items || []);
        setCategories(offline.itemCategories || []);
        setTags(offline.itemTags || []);
      }
      const [iRes, cRes, tRes] = await Promise.all([
        fetch(ITEMS_URL),
        fetch(CATS_URL),
        fetch(TAGS_URL),
      ]);
      if (iRes.ok) {
        const list = (await iRes.json()) as InventoryItem[];
        setItems((prev) => mergeLists(prev, list, null));
      }
      if (cRes.ok) {
        const list = (await cRes.json()) as ItemCategory[];
        setCategories((prev) => mergeLists(prev, list, null));
      }
      if (tRes.ok) {
        const list = (await tRes.json()) as ItemTag[];
        setTags((prev) => mergeLists(prev, list, null));
      }
      const synced = await syncWithServer();
      setItems((prev) => mergeLists(prev, synced.items || [], null));
      setCategories((prev) =>
        mergeLists(prev, synced.itemCategories || [], null),
      );
      setTags((prev) => mergeLists(prev, synced.itemTags || [], null));
      setLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (!initialized) {
      setInitialized(true);
      return;
    }
    const save = async () => {
      try {
        const dataStr = JSON.stringify({
          items,
          itemCategories: categories,
          itemTags: tags,
        });
        if (dataStr !== lastDataRef.current) {
          lastDataRef.current = dataStr;
          updateOfflineData({
            items,
            itemCategories: categories,
            itemTags: tags,
          });
        }
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
        await syncWithServer();
      } catch (err) {
        console.error("Error saving inventory", err);
      }
    };
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(save, 500);
  }, [items, categories, tags, loaded]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

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
        if (updates.description !== undefined)
          next.description = updates.description;
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

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const store = useInventoryImpl();
  return (
    <InventoryContext.Provider value={store}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventoryStore = () => {
  const ctx = useContext(InventoryContext);
  if (!ctx)
    throw new Error("useInventoryStore must be used within InventoryProvider");
  return ctx;
};
