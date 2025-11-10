import { useTranslation } from "react-i18next";

export default function Welcome() {
  const { t } = useTranslation();

  return (
    <div className="flex justify-center">
      <div className="mx-auto max-w-xl rounded-xl px-8 py-6 text-center">
        <h1 className="text-4xl font-bold text-foreground">
          {t("welcome.welcomeMessage")}
        </h1>
        <p className="mt-4 text-muted-foreground">
          {t("welcome.description")}
        </p>
      </div>
    </div>
  );
}