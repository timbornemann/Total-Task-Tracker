import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en/translation.json";
import de from "@/locales/de/translation.json";

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  lng: "de",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
