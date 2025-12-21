import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { usePasswordStrength } from "@/hooks/usePasswordStrength";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
  id?: string;
}

const scoreToPercent = (score: 0 | 1 | 2 | 3 | 4) => (score / 4) * 100;

export default function PasswordStrengthMeter({ password, className, id }: PasswordStrengthMeterProps) {
  const { t } = useTranslation();
  const { score } = usePasswordStrength(password);

  const { labelKey, badgeVariant, progressVariant } = useMemo(() => {
    switch (score) {
      case 0:
        return { labelKey: "common.passwordStrength.veryWeak", badgeVariant: "destructive" as const, progressVariant: "destructive" as const };
      case 1:
        return { labelKey: "common.passwordStrength.weak", badgeVariant: "destructive" as const, progressVariant: "destructive" as const };
      case 2:
        return { labelKey: "common.passwordStrength.fair", badgeVariant: "secondary" as const, progressVariant: "accent" as const };
      case 3:
        return { labelKey: "common.passwordStrength.good", badgeVariant: "default" as const, progressVariant: "default" as const };
      case 4:
      default:
        return { labelKey: "common.passwordStrength.strong", badgeVariant: "tertiary" as const, progressVariant: "tertiary" as const };
    }
  }, [score]);

  const strengthLabel = t(labelKey);

  return (
    <div id={id} className={cn("flex flex-col gap-1", className)} role="status" aria-live="polite" aria-label={`${t("common.passwordStrength.label")}: ${strengthLabel}`}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("common.passwordStrength.label")}</span>
        <Badge variant={badgeVariant} aria-hidden="true">{strengthLabel}</Badge>
      </div>
      <Progress value={scoreToPercent(score)} variant={progressVariant} aria-label={`${t("common.passwordStrength.label")} ${Math.round(scoreToPercent(score))}%`} />
    </div>
  );
}
