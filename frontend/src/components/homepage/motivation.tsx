import { useTranslation } from "react-i18next";

export default function Motivation() {
  const { t } = useTranslation();

  return (
    <div className="flex justify-center">
      <div className="mx-auto max-w-xl rounded-xl px-8 py-6 text-center">
        <h1 className="text-4xl font-extrabold text-foreground">
          {t("motivation.stayMotivated")}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {t("motivation.keepPushing")}
        </p>
      </div>
    </div>
  );
}
