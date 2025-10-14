import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../i18n/en.json";
import tr from "../i18n/tr.json";

const resources = {
  en: { translation: en },
  tr: { translation: tr }
};

i18n
  .use(initReactI18next)
  .init({
  resources,
  lng: "tr",
  fallbackLng: "tr",
  interpolation: { escapeValue: false }
});

export default i18n;
