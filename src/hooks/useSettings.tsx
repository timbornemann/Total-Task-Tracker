import React, { createContext, useContext, useEffect, useState } from "react";
import { allHomeSections } from "@/utils/homeSections";
import { allNavbarItems } from "@/utils/navbarItems";
import i18n from "@/lib/i18n";
import {
  defaultColorPalette,
  themePresets,
  type ThemeType,
} from "@/lib/themes";

export type ShortcutKeys = {
  openCommand: string;
  newTask: string;
  newNote: string;
  newFlashcard: string;
};

const defaultShortcuts: ShortcutKeys = {
  openCommand: "ctrl+k",
  newTask: "ctrl+alt+t",
  newNote: "ctrl+alt+n",
  newFlashcard: "ctrl+alt+f",
};

const defaultPomodoro = {
  workMinutes: 25,
  breakMinutes: 5,
  workSound: "",
  breakSound: "",
  customSounds: [] as string[],
};
const defaultFlashcardSettings = {
  timerSeconds: 10,
  sessionSize: 5,
  defaultMode: "spaced" as
    | "spaced"
    | "training"
    | "random"
    | "typing"
    | "timed",
};
const defaultSyncInterval = 5;
const defaultSyncEnabled = true;
const defaultTaskPriority: "low" | "medium" | "high" = "medium";
const defaultTaskLayoutSetting: "list" | "grid" = "list";
const defaultShowCompletedTasksSetting = true;
const defaultTaskColorSetting = 0;
const defaultTimerColorSetting = 0;
const defaultHabitColorSetting = 0;
const defaultTripColorSetting = 0;
const defaultHabitRecurrenceSetting: "daily" | "weekly" | "monthly" | "yearly" =
  "daily";
const defaultTimerExtendSetting = 60;
const defaultLanguage = "de";
const defaultLlmUrl = "";
const defaultLlmToken = "";
const defaultLlmModel = "gpt-3.5-turbo";
const defaultOfflineCache = true;
const defaultWorklogEnabled = true;
const defaultBatchTasksEnabled = false;

export const defaultHomeSectionColors: Record<string, number> =
  allHomeSections.reduce(
    (acc, sec, idx) => {
      acc[sec.key] = idx % defaultColorPalette.length;
      return acc;
    },
    {} as Record<string, number>,
  );

export const defaultNavbarItemOrder: Record<string, string[]> = {
  tasks: allNavbarItems.filter((i) => i.group === "tasks").map((i) => i.key),
  learning: allNavbarItems
    .filter((i) => i.group === "learning")
    .map((i) => i.key),
  standalone: allNavbarItems.map((i) => i.key),
};

export const defaultNavbarItems: Record<string, string[]> = {
  tasks: [...defaultNavbarItemOrder.tasks],
  learning: [...defaultNavbarItemOrder.learning],
  // On startup, show only the settings entry as standalone (matches "Navigation Zurücksetzen")
  standalone: [
    allNavbarItems.find((item) => item.labelKey === "navbar.settings")?.key ||
      "settings",
  ],
};

export const defaultNavbarGroups = ["tasks", "learning"];

interface SettingsContextValue {
  shortcuts: ShortcutKeys;
  updateShortcut: (key: keyof ShortcutKeys, value: string) => void;
  pomodoro: {
    workMinutes: number;
    breakMinutes: number;
    workSound: string;
    breakSound: string;
    customSounds: string[];
  };
  updatePomodoro: (
    key: "workMinutes" | "breakMinutes" | "workSound" | "breakSound",
    value: number | string,
  ) => void;
  addPomodoroSound: (url: string) => void;
  deletePomodoroSound: (url: string) => void;
  defaultTaskPriority: "low" | "medium" | "high";
  updateDefaultTaskPriority: (value: "low" | "medium" | "high") => void;
  theme: ThemeType;
  updateTheme: (key: keyof ThemeType, value: string) => void;
  themeName: string;
  updateThemeName: (name: string) => void;
  customThemes: {
    name: string;
    theme: ThemeType;
    colorPalette: string[];
  }[];
  addCustomTheme: (name: string) => void;
  deleteCustomTheme: (name: string) => void;
  colorPalette: string[];
  updatePaletteColor: (index: number, value: string) => void;
  homeSectionColors: Record<string, number>;
  updateHomeSectionColor: (section: string, color: number) => void;
  homeSections: string[];
  homeSectionOrder: string[];
  toggleHomeSection: (section: string) => void;
  reorderHomeSections: (start: number, end: number) => void;
  navbarItems: Record<string, string[]>;
  toggleNavbarItem: (group: string, key: string) => void;
  removeNavbarItemFromGroup: (group: string, key: string) => void;
  renameNavbarGroup: (oldName: string, newName: string) => void;
  navbarGroups: string[];
  addNavbarGroup: (name: string) => void;
  deleteNavbarGroup: (name: string) => void;
  addNavbarItemToGroup: (group: string, key: string) => void;
  resetNavbarSettings: () => void;
  navbarItemOrder: Record<string, string[]>;
  reorderNavbarItems: (group: string, start: number, end: number) => void;
  showPinnedTasks: boolean;
  toggleShowPinnedTasks: () => void;
  showPinnedNotes: boolean;
  toggleShowPinnedNotes: () => void;
  showPinnedCategories: boolean;
  toggleShowPinnedCategories: () => void;
  showPinnedHabits: boolean;
  toggleShowPinnedHabits: () => void;
  collapseSubtasksByDefault: boolean;
  toggleCollapseSubtasksByDefault: () => void;
  defaultTaskLayout: "list" | "grid";
  updateDefaultTaskLayout: (val: "list" | "grid") => void;
  showCompletedByDefault: boolean;
  toggleShowCompletedByDefault: () => void;
  defaultTaskColor: number;
  updateDefaultTaskColor: (val: number) => void;
  defaultTimerColor: number;
  updateDefaultTimerColor: (val: number) => void;
  defaultHabitColor: number;
  updateDefaultHabitColor: (val: number) => void;
  defaultTripColor: number;
  updateDefaultTripColor: (val: number) => void;
  defaultHabitRecurrence: "daily" | "weekly" | "monthly" | "yearly";
  updateDefaultHabitRecurrence: (
    val: "daily" | "weekly" | "monthly" | "yearly",
  ) => void;
  timerExtendSeconds: number;
  updateTimerExtendSeconds: (val: number) => void;
  flashcardTimer: number;
  updateFlashcardTimer: (value: number) => void;
  flashcardSessionSize: number;
  updateFlashcardSessionSize: (value: number) => void;
  flashcardDefaultMode: "spaced" | "training" | "random" | "typing" | "timed";
  updateFlashcardDefaultMode: (
    value: "spaced" | "training" | "random" | "typing" | "timed",
  ) => void;
  syncRole: "server" | "client";
  updateSyncRole: (role: "server" | "client") => void;
  syncServerUrl: string;
  updateSyncServerUrl: (url: string) => void;
  syncInterval: number;
  updateSyncInterval: (value: number) => void;
  syncEnabled: boolean;
  updateSyncEnabled: (value: boolean) => void;
  language: string;
  updateLanguage: (lang: string) => void;
  llmUrl: string;
  updateLlmUrl: (url: string) => void;
  llmToken: string;
  updateLlmToken: (token: string) => void;
  llmModel: string;
  updateLlmModel: (model: string) => void;
  offlineCache: boolean;
  toggleOfflineCache: () => void;
  enableWorklog: boolean;
  toggleEnableWorklog: () => void;
  worklogCardShadow: boolean;
  toggleWorklogCardShadow: () => void;
  defaultWorkLocation: string;
  updateDefaultWorkLocation: (val: string) => void;
  enableBatchTasks: boolean;
  toggleEnableBatchTasks: () => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [shortcuts, setShortcuts] = useState<ShortcutKeys>(defaultShortcuts);
  const [pomodoro, setPomodoro] = useState(defaultPomodoro);
  const [flashcardTimer, setFlashcardTimer] = useState(
    defaultFlashcardSettings.timerSeconds,
  );
  const [flashcardSessionSize, setFlashcardSessionSize] = useState(
    defaultFlashcardSettings.sessionSize,
  );
  const [flashcardDefaultMode, setFlashcardDefaultMode] = useState(
    defaultFlashcardSettings.defaultMode,
  );
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    defaultTaskPriority,
  );
  const [theme, setTheme] = useState(themePresets.light.theme);
  const [themeName, setThemeName] = useState("light");
  const [customThemes, setCustomThemes] = useState<
    {
      name: string;
      theme: ThemeType;
      colorPalette: string[];
    }[]
  >([]);
  const [colorPalette, setColorPalette] =
    useState<string[]>(defaultColorPalette);
  const [homeSectionColors, setHomeSectionColors] = useState<
    Record<string, number>
  >({ ...defaultHomeSectionColors });
  const [homeSectionOrder, setHomeSectionOrder] = useState<string[]>(
    allHomeSections.map((s) => s.key),
  );
  const [homeSections, setHomeSections] = useState<string[]>([
    "tasks",
    "flashcards",
    "notes",
  ]);
  // Benutze einen Ref um zu verfolgen, ob wir bereits Einstellungen geladen haben
  const initialNavSettingsLoaded = React.useRef(false);

  // Nutze memo für die Anfangswerte, damit diese nicht bei jedem Render neu erstellt werden
  const initialNavbarGroups = React.useMemo(() => [...defaultNavbarGroups], []);
  const initialNavbarItems = React.useMemo(
    () => ({ ...defaultNavbarItems }),
    [],
  );
  const initialNavbarItemOrder = React.useMemo(
    () => ({ ...defaultNavbarItemOrder }),
    [],
  );

  const [navbarGroups, setNavbarGroups] =
    useState<string[]>(initialNavbarGroups);
  const [navbarItems, setNavbarItems] =
    useState<Record<string, string[]>>(initialNavbarItems);
  const [navbarItemOrder, setNavbarItemOrder] = useState<
    Record<string, string[]>
  >(initialNavbarItemOrder);
  const [showPinnedTasks, setShowPinnedTasks] = useState(true);
  const [showPinnedNotes, setShowPinnedNotes] = useState(true);
  const [showPinnedCategories, setShowPinnedCategories] = useState(true);
  const [showPinnedHabits, setShowPinnedHabits] = useState(true);
  const [collapseSubtasksByDefault, setCollapseSubtasksByDefault] =
    useState(false);
  const [defaultTaskLayout, setDefaultTaskLayout] = useState<"list" | "grid">(
    defaultTaskLayoutSetting,
  );
  const [showCompletedByDefault, setShowCompletedByDefault] = useState(
    defaultShowCompletedTasksSetting,
  );
  const [defaultTaskColor, setDefaultTaskColor] = useState(
    defaultTaskColorSetting,
  );
  const [defaultTimerColor, setDefaultTimerColor] = useState(
    defaultTimerColorSetting,
  );
  const [defaultHabitColor, setDefaultHabitColor] = useState(
    defaultHabitColorSetting,
  );
  const [defaultTripColor, setDefaultTripColor] = useState(
    defaultTripColorSetting,
  );
  const [defaultHabitRecurrence, setDefaultHabitRecurrence] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >(defaultHabitRecurrenceSetting);
  const [timerExtendSeconds, setTimerExtendSeconds] = useState(
    defaultTimerExtendSetting,
  );
  const [syncRole, setSyncRole] = useState<"server" | "client">("client");
  const [syncServerUrl, setSyncServerUrl] = useState("");
  const [syncInterval, setSyncInterval] = useState(defaultSyncInterval);
  const [syncEnabled, setSyncEnabled] = useState(defaultSyncEnabled);
  const [language, setLanguage] = useState(defaultLanguage);
  const [llmUrl, setLlmUrl] = useState(defaultLlmUrl);
  const [llmToken, setLlmToken] = useState(defaultLlmToken);
  const [llmModel, setLlmModel] = useState(defaultLlmModel);
  const [offlineCache, setOfflineCache] = useState(defaultOfflineCache);
  const [enableWorklog, setEnableWorklog] = useState(defaultWorklogEnabled);
  const [enableBatchTasks, setEnableBatchTasks] = useState(
    defaultBatchTasksEnabled,
  );
  const [worklogCardShadow, setWorklogCardShadow] = useState(true);
  const [defaultWorkLocation, setDefaultWorkLocation] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        console.log("Loading settings...");
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          // Nach dem ersten Laden setzen wir die Ref auf true
          initialNavSettingsLoaded.current = true;
          if (data.shortcuts) {
            setShortcuts({ ...defaultShortcuts, ...data.shortcuts });
          }
          if (data.pomodoro) {
            setPomodoro({
              ...defaultPomodoro,
              ...data.pomodoro,
              customSounds: Array.isArray(data.pomodoro.customSounds)
                ? data.pomodoro.customSounds
                : defaultPomodoro.customSounds,
            });
          }
          if (data.defaultTaskPriority) {
            setPriority(data.defaultTaskPriority);
          }
          if (data.themeName) {
            setThemeName(data.themeName);
            const preset = themePresets[data.themeName];
            if (preset) {
              setTheme(preset.theme);
              setColorPalette(preset.colorPalette);
            } else if (data.theme) {
              setTheme({ ...themePresets.light.theme, ...data.theme });
            }
            if (!preset && Array.isArray(data.colorPalette)) {
              setColorPalette(data.colorPalette);
            }
            if (Array.isArray(data.customThemes)) {
              setCustomThemes(data.customThemes);
            }
          } else {
            if (data.theme) {
              setTheme({ ...themePresets.light.theme, ...data.theme });
            }
            if (Array.isArray(data.colorPalette)) {
              setColorPalette(data.colorPalette);
            }
            if (Array.isArray(data.customThemes)) {
              setCustomThemes(data.customThemes);
            }
          }
          if (Array.isArray(data.homeSectionOrder)) {
            const order = data.homeSectionOrder as string[];
            setHomeSectionOrder(
              order.concat(
                allHomeSections
                  .filter((s) => !order.includes(s.key))
                  .map((s) => s.key),
              ),
            );
          } else if (Array.isArray(data.homeSections)) {
            setHomeSectionOrder(
              data.homeSections.concat(
                allHomeSections
                  .filter((s) => !data.homeSections.includes(s.key))
                  .map((s) => s.key),
              ),
            );
            setHomeSections(data.homeSections);
          }
          if (
            data.homeSectionColors &&
            typeof data.homeSectionColors === "object"
          ) {
            setHomeSectionColors({
              ...defaultHomeSectionColors,
              ...data.homeSectionColors,
            });
          }

          // Handle navbar settings with improved validation and protection against resets
          let hasNavbarData = false;

          // Only update navbar groups if data exists and is valid
          if (
            Array.isArray(data.navbarGroups) &&
            data.navbarGroups.length > 0
          ) {
            setNavbarGroups(data.navbarGroups);
            hasNavbarData = true;
          }

          // Only update navbar items if data exists and is valid
          if (
            data.navbarItems &&
            typeof data.navbarItems === "object" &&
            !Array.isArray(data.navbarItems) &&
            Object.keys(data.navbarItems).length > 0
          ) {
            setNavbarItems({ ...data.navbarItems });
            hasNavbarData = true;
          }

          // Only update navbar item order if data exists and is valid
          if (
            data.navbarItemOrder &&
            typeof data.navbarItemOrder === "object" &&
            Object.keys(data.navbarItemOrder).length > 0
          ) {
            const order: Record<string, string[]> = { ...data.navbarItemOrder };
            const groups =
              Array.isArray(data.navbarGroups) && data.navbarGroups.length > 0
                ? data.navbarGroups
                : hasNavbarData
                  ? navbarGroups
                  : defaultNavbarGroups;

            // Keep existing standalone items if available
            if (!order.standalone || order.standalone.length === 0) {
              const settingsItemKey = allNavbarItems.find(
                (item) => item.labelKey === "navbar.settings",
              )?.key;
              order.standalone = settingsItemKey ? [settingsItemKey] : [];
            }

            groups.forEach((g) => {
              if (!order[g]) order[g] = [];
            });

            setNavbarItemOrder(order);
            hasNavbarData = true;
          }
          if (Array.isArray(data.homeSections)) {
            setHomeSections(data.homeSections);
          }
          if (typeof data.showPinnedTasks === "boolean") {
            setShowPinnedTasks(data.showPinnedTasks);
          }
          if (typeof data.showPinnedNotes === "boolean") {
            setShowPinnedNotes(data.showPinnedNotes);
          }
          if (typeof data.showPinnedCategories === "boolean") {
            setShowPinnedCategories(data.showPinnedCategories);
          }
          if (typeof data.showPinnedHabits === "boolean") {
            setShowPinnedHabits(data.showPinnedHabits);
          }
          if (typeof data.collapseSubtasksByDefault === "boolean") {
            setCollapseSubtasksByDefault(data.collapseSubtasksByDefault);
          }
          if (typeof data.defaultTaskLayout === "string") {
            setDefaultTaskLayout(data.defaultTaskLayout);
          }
          if (typeof data.showCompletedByDefault === "boolean") {
            setShowCompletedByDefault(data.showCompletedByDefault);
          }
          if (typeof data.defaultTaskColor === "number") {
            setDefaultTaskColor(data.defaultTaskColor);
          }
          if (typeof data.defaultTimerColor === "number") {
            setDefaultTimerColor(data.defaultTimerColor);
          }
          if (typeof data.defaultHabitColor === "number") {
            setDefaultHabitColor(data.defaultHabitColor);
          }
          if (typeof data.defaultTripColor === "number") {
            setDefaultTripColor(data.defaultTripColor);
          }
          if (typeof data.defaultHabitRecurrence === "string") {
            setDefaultHabitRecurrence(data.defaultHabitRecurrence);
          }
          if (typeof data.timerExtendSeconds === "number") {
            setTimerExtendSeconds(data.timerExtendSeconds);
          }
          if (typeof data.flashcardTimer === "number") {
            setFlashcardTimer(data.flashcardTimer);
          }
          if (typeof data.flashcardSessionSize === "number") {
            setFlashcardSessionSize(data.flashcardSessionSize);
          }
          if (typeof data.flashcardDefaultMode === "string") {
            setFlashcardDefaultMode(data.flashcardDefaultMode);
          }
          if (typeof data.syncRole === "string") {
            setSyncRole(data.syncRole);
          }
          if (typeof data.syncServerUrl === "string") {
            setSyncServerUrl(data.syncServerUrl);
          }
          if (typeof data.syncInterval === "number") {
            setSyncInterval(data.syncInterval);
          }
          if (typeof data.syncEnabled === "boolean") {
            setSyncEnabled(data.syncEnabled);
          }
          if (typeof data.language === "string") {
            setLanguage(data.language);
            i18n.changeLanguage(data.language);
          }
          if (typeof data.llmUrl === "string") {
            setLlmUrl(data.llmUrl);
          }
          if (typeof data.llmToken === "string") {
            setLlmToken(data.llmToken);
          }
          if (typeof data.llmModel === "string") {
            setLlmModel(data.llmModel);
          }
          if (typeof data.offlineCache === "boolean") {
            setOfflineCache(data.offlineCache);
          }
          if (typeof data.enableWorklog === "boolean") {
            setEnableWorklog(data.enableWorklog);
          }
          if (typeof data.enableBatchTasks === "boolean") {
            setEnableBatchTasks(data.enableBatchTasks);
          }
          if (typeof data.worklogCardShadow === "boolean") {
            setWorklogCardShadow(data.worklogCardShadow);
          }
          if (typeof data.defaultWorkLocation === "string") {
            setDefaultWorkLocation(data.defaultWorkLocation);
          }
        }
      } catch (err) {
        console.error("Error loading settings", err);
      }
      setLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const save = async () => {
      try {
        // Stelle sicher, dass wir vor dem Speichern initialisiert sind
        console.log(
          "Saving settings, navbarGroups length:",
          navbarGroups.length,
        );

        // Leere Navbar-Einstellungen nicht speichern, wenn wir keine Daten geladen haben
        const navSettingsToSave = initialNavSettingsLoaded.current
          ? {
              navbarGroups,
              navbarItems,
              navbarItemOrder,
            }
          : {};

        await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shortcuts,
            pomodoro,
            defaultTaskPriority: priority,
            theme,
            themeName,
            customThemes,
            colorPalette,
            homeSectionColors,
            homeSections,
            homeSectionOrder,
            ...navSettingsToSave,
            showPinnedTasks,
            showPinnedNotes,
            showPinnedCategories,
            showPinnedHabits,
            collapseSubtasksByDefault,
            defaultTaskLayout,
            showCompletedByDefault,
            defaultTaskColor,
            defaultTimerColor,
            defaultHabitColor,
            defaultTripColor,
            defaultHabitRecurrence,
            timerExtendSeconds,
            flashcardTimer,
            flashcardSessionSize,
            flashcardDefaultMode,
            syncRole,
            syncServerUrl,
            syncInterval,
            syncEnabled,
            language,
            llmUrl,
            llmToken,
            llmModel,
            offlineCache,
            enableBatchTasks,
            enableWorklog,
            worklogCardShadow,
            defaultWorkLocation,
          }),
        });
      } catch (err) {
        console.error("Error saving settings", err);
      }
    };

    save();
  }, [
    loaded,
    shortcuts,
    pomodoro,
    priority,
    theme,
    themeName,
    customThemes,
    colorPalette,
    homeSectionColors,
    homeSections,
    homeSectionOrder,
    navbarGroups,
    navbarItems,
    navbarItemOrder,
    showPinnedTasks,
    showPinnedNotes,
    showPinnedCategories,
    showPinnedHabits,
    collapseSubtasksByDefault,
    defaultTaskLayout,
    showCompletedByDefault,
    defaultTaskColor,
    defaultTimerColor,
    defaultHabitColor,
    defaultTripColor,
    defaultHabitRecurrence,
    timerExtendSeconds,
    flashcardTimer,
    flashcardSessionSize,
    flashcardDefaultMode,
    syncRole,
    syncServerUrl,
    syncInterval,
    syncEnabled,
    language,
    llmUrl,
    llmToken,
    llmModel,
    offlineCache,
    enableBatchTasks,
    enableWorklog,
    worklogCardShadow,
    defaultWorkLocation,
  ]);

  useEffect(() => {
    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
    if (["dark", "dark-red", "hacker"].includes(themeName)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme, themeName]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const updateShortcut = (key: keyof ShortcutKeys, value: string) => {
    setShortcuts((prev) => ({ ...prev, [key]: value.toLowerCase() }));
  };

  const updatePomodoro = (
    key: "workMinutes" | "breakMinutes" | "workSound" | "breakSound",
    value: number | string,
  ) => {
    setPomodoro((prev) => ({ ...prev, [key]: value }));
  };

  const addPomodoroSound = (url: string) => {
    setPomodoro((prev) => {
      if (prev.customSounds.includes(url)) return prev;
      return { ...prev, customSounds: [url, ...prev.customSounds] };
    });
  };

  const deletePomodoroSound = (url: string) => {
    setPomodoro((prev) => ({
      ...prev,
      customSounds: prev.customSounds.filter((s) => s !== url),
    }));
  };

  const updateDefaultTaskPriority = (value: "low" | "medium" | "high") => {
    setPriority(value);
  };

  const updateTheme = (key: keyof ThemeType, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
    setThemeName("custom");
  };

  const updateThemeName = (name: string) => {
    setThemeName(name);
    const preset = themePresets[name];
    const custom = customThemes.find((t) => t.name === name);
    if (preset) {
      setTheme(preset.theme);
      setColorPalette(preset.colorPalette);
    } else if (custom) {
      setTheme(custom.theme);
      setColorPalette(custom.colorPalette);
    }
  };

  const updatePaletteColor = (index: number, value: string) => {
    setColorPalette((prev) => {
      const arr = [...prev];
      arr[index] = value;
      return arr;
    });
    setThemeName("custom");
  };

  const addCustomTheme = (name: string) => {
    setCustomThemes((prev) => [
      { name, theme: { ...theme }, colorPalette: [...colorPalette] },
      ...prev.filter((t) => t.name !== name),
    ]);
    setThemeName(name);
  };

  const deleteCustomTheme = (name: string) => {
    setCustomThemes((prev) => prev.filter((t) => t.name !== name));
    if (themeName === name) {
      setThemeName("light");
      const preset = themePresets["light"];
      setTheme(preset.theme);
      setColorPalette(preset.colorPalette);
    }
  };

  const updateHomeSectionColor = (section: string, color: number) => {
    setHomeSectionColors((prev) => ({ ...prev, [section]: color }));
  };

  const updateFlashcardTimer = (value: number) => {
    setFlashcardTimer(value);
  };

  const updateFlashcardSessionSize = (value: number) => {
    setFlashcardSessionSize(value);
  };

  const updateFlashcardDefaultMode = (
    value: "spaced" | "training" | "random" | "typing" | "timed",
  ) => {
    setFlashcardDefaultMode(value);
  };

  const updateSyncRole = (role: "server" | "client") => {
    setSyncRole(role);
  };

  const updateSyncServerUrl = (url: string) => {
    setSyncServerUrl(url);
  };

  const updateSyncInterval = (value: number) => {
    setSyncInterval(value);
  };

  const updateSyncEnabled = (value: boolean) => {
    setSyncEnabled(value);
  };

  const toggleOfflineCache = () => {
    setOfflineCache((prev) => !prev);
  };

  const toggleEnableBatchTasks = () => {
    setEnableBatchTasks((prev) => !prev);
  };

  const toggleEnableWorklog = () => {
    setEnableWorklog((prev) => !prev);
  };

  const toggleWorklogCardShadow = () => {
    setWorklogCardShadow((prev) => !prev);
  };

  const updateDefaultWorkLocation = (value: string) => {
    setDefaultWorkLocation(value);
  };

  const updateLanguage = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const updateLlmUrl = (url: string) => {
    setLlmUrl(url);
  };

  const updateLlmToken = (token: string) => {
    setLlmToken(token);
  };

  const updateLlmModel = (model: string) => {
    setLlmModel(model);
  };

  const updateDefaultTaskLayout = (val: "list" | "grid") => {
    setDefaultTaskLayout(val);
  };

  const toggleShowCompletedByDefault = () => {
    setShowCompletedByDefault((prev) => !prev);
  };

  const updateDefaultTaskColor = (val: number) => {
    setDefaultTaskColor(val);
  };

  const updateDefaultTimerColor = (val: number) => {
    setDefaultTimerColor(val);
  };

  const updateDefaultHabitColor = (val: number) => {
    setDefaultHabitColor(val);
  };

  const updateDefaultTripColor = (val: number) => {
    setDefaultTripColor(val);
  };

  const updateDefaultHabitRecurrence = (
    val: "daily" | "weekly" | "monthly" | "yearly",
  ) => {
    setDefaultHabitRecurrence(val);
  };

  const updateTimerExtendSeconds = (val: number) => {
    setTimerExtendSeconds(val);
  };

  const toggleHomeSection = (section: string) => {
    setHomeSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const reorderHomeSections = (start: number, end: number) => {
    setHomeSectionOrder((prev) => {
      const updated = Array.from(prev);
      const [removed] = updated.splice(start, 1);
      updated.splice(end, 0, removed);
      return updated;
    });
  };

  const reorderNavbarItems = (group: string, start: number, end: number) => {
    setNavbarItemOrder((prev) => {
      const list = prev[group] ? Array.from(prev[group]) : [];
      const [removed] = list.splice(start, 1);
      list.splice(end, 0, removed);
      return { ...prev, [group]: list };
    });
  };

  const addNavbarGroup = (name: string) => {
    setNavbarGroups((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setNavbarItemOrder((prev) => ({ ...prev, [name]: prev[name] || [] }));
    setNavbarItems((prev) => ({ ...prev, [name]: prev[name] || [] }));
  };

  const deleteNavbarGroup = (name: string) => {
    setNavbarGroups((prev) => prev.filter((g) => g !== name));
    setNavbarItemOrder((prev) => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
    setNavbarItems((prev) => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  const renameNavbarGroup = (oldName: string, newName: string) => {
    if (!newName || oldName === newName) return;
    setNavbarGroups((prev) => prev.map((g) => (g === oldName ? newName : g)));
    setNavbarItemOrder((prev) => {
      const updated = { ...prev } as Record<string, string[]>;
      updated[newName] = updated[oldName] || [];
      delete updated[oldName];
      return updated;
    });
    setNavbarItems((prev) => {
      const updated = { ...prev } as Record<string, string[]>;
      updated[newName] = updated[oldName] || [];
      delete updated[oldName];
      return updated;
    });
  };

  const addNavbarItemToGroup = (group: string, key: string) => {
    setNavbarItemOrder((prev) => {
      const items = prev[group] ? Array.from(prev[group]) : [];
      if (!items.includes(key)) items.push(key);
      return { ...prev, [group]: items };
    });
    setNavbarItems((prev) => {
      const items = prev[group] ? Array.from(prev[group]) : [];
      if (!items.includes(key)) items.push(key);
      return { ...prev, [group]: items };
    });
  };

  const removeNavbarItemFromGroup = (group: string, key: string) => {
    setNavbarItemOrder((prev) => {
      const items = prev[group] ? prev[group].filter((k) => k !== key) : [];
      return { ...prev, [group]: items };
    });
    setNavbarItems((prev) => {
      const items = prev[group] ? prev[group].filter((k) => k !== key) : [];
      return { ...prev, [group]: items };
    });
  };

  const resetNavbarSettings = () => {
    // Führe einen echten Reset nur durch, wenn der Benutzer tatsächlich klickt
    console.log("Manual navbar reset triggered by user");

    setNavbarGroups([...defaultNavbarGroups]);

    // Create a modified version of default navbar items where only settings is enabled in standalone
    const modifiedNavbarItems = { ...defaultNavbarItems };

    // Find the settings item key from all navbar items
    const settingsItemKey = allNavbarItems.find(
      (item) => item.labelKey === "navbar.settings",
    )?.key;

    // Update the standalone items to only include settings if it exists
    modifiedNavbarItems.standalone = settingsItemKey ? [settingsItemKey] : [];

    setNavbarItems(modifiedNavbarItems);
    setNavbarItemOrder({ ...defaultNavbarItemOrder });
  };

  const toggleNavbarItem = (group: string, key: string) => {
    setNavbarItems((prev) => {
      const items = prev[group] ? Array.from(prev[group]) : [];
      const idx = items.indexOf(key);
      if (idx >= 0) items.splice(idx, 1);
      else items.push(key);
      return { ...prev, [group]: items };
    });
  };

  const toggleShowPinnedTasks = () => {
    setShowPinnedTasks((prev) => !prev);
  };

  const toggleShowPinnedNotes = () => {
    setShowPinnedNotes((prev) => !prev);
  };

  const toggleShowPinnedCategories = () => {
    setShowPinnedCategories((prev) => !prev);
  };

  const toggleShowPinnedHabits = () => {
    setShowPinnedHabits((prev) => !prev);
  };

  const toggleCollapseSubtasksByDefault = () => {
    setCollapseSubtasksByDefault((prev) => !prev);
  };

  return (
    <SettingsContext.Provider
      value={{
        shortcuts,
        updateShortcut,
        pomodoro,
        updatePomodoro,
        addPomodoroSound,
        deletePomodoroSound,
        defaultTaskPriority: priority,
        updateDefaultTaskPriority,
        theme,
        updateTheme,
        themeName,
        updateThemeName,
        customThemes,
        addCustomTheme,
        deleteCustomTheme,
        colorPalette,
        updatePaletteColor,
        homeSectionColors,
        updateHomeSectionColor,
        homeSections,
        homeSectionOrder,
        toggleHomeSection,
        reorderHomeSections,
        navbarGroups,
        addNavbarGroup,
        deleteNavbarGroup,
        renameNavbarGroup,
        addNavbarItemToGroup,
        removeNavbarItemFromGroup,
        resetNavbarSettings,
        navbarItems,
        toggleNavbarItem,
        navbarItemOrder,
        reorderNavbarItems,
        showPinnedTasks,
        toggleShowPinnedTasks,
        showPinnedNotes,
        toggleShowPinnedNotes,
        showPinnedCategories,
        toggleShowPinnedCategories,
        showPinnedHabits,
        toggleShowPinnedHabits,
        collapseSubtasksByDefault,
        toggleCollapseSubtasksByDefault,
        defaultTaskLayout,
        updateDefaultTaskLayout,
        showCompletedByDefault,
        toggleShowCompletedByDefault,
        defaultTaskColor,
        updateDefaultTaskColor,
        defaultTimerColor,
        updateDefaultTimerColor,
        defaultHabitColor,
        updateDefaultHabitColor,
        defaultTripColor,
        updateDefaultTripColor,
        defaultHabitRecurrence,
        updateDefaultHabitRecurrence,
        timerExtendSeconds,
        updateTimerExtendSeconds,
        flashcardTimer,
        updateFlashcardTimer,
        flashcardSessionSize,
        updateFlashcardSessionSize,
        flashcardDefaultMode,
        updateFlashcardDefaultMode,
        syncRole,
        updateSyncRole,
        syncServerUrl,
        updateSyncServerUrl,
        syncInterval,
        updateSyncInterval,
        syncEnabled,
        updateSyncEnabled,
        language,
        updateLanguage,
        llmUrl,
        updateLlmUrl,
        llmToken,
        updateLlmToken,
        llmModel,
        updateLlmModel,
        offlineCache,
        toggleOfflineCache,
        enableBatchTasks,
        toggleEnableBatchTasks,
        enableWorklog,
        toggleEnableWorklog,
        worklogCardShadow,
        toggleWorklogCardShadow,
        defaultWorkLocation,
        updateDefaultWorkLocation,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
};
