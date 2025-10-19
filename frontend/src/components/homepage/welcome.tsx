import { useTranslation } from "react-i18next";

export default function Welcome() {
    const { t } = useTranslation();

    return (
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold">{t("welcome.welcomeMessage")}</h1>
        <p className="mt-4">{t("welcome.description")}</p>
      </div>
    );
}  