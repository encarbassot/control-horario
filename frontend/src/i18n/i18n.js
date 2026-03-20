import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import es from "./locales/es.json"
import en from "./locales/en.json"
import ca from "./locales/ca.json"

export const LANGUAGE_KEY = "language"
export const SUPPORTED_LANGUAGES = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "ca", label: "Català" },
]

const savedLanguage = localStorage.getItem(LANGUAGE_KEY) || "es"

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      ca: { translation: ca },
    },
    lng: savedLanguage,
    fallbackLng: "es",
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
