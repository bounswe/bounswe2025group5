import { useState, type FormEvent } from "react";
import { AuthApi } from "@/lib/api/auth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { usePasswordStrength } from "@/hooks/usePasswordStrength";
import PasswordStrengthMeter from "@/components/common/password-strength-meter";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MIN_PASSWORD_LENGTH = 8;


export default function Register() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { isStrong: isPasswordStrong } = usePasswordStrength(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t("register.error.tooShort", { min: MIN_PASSWORD_LENGTH }));
      return;
    }

    if (!isPasswordStrong) {
      setError(t("register.error.tooWeak"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("register.error.passwordsDontMatch"));
      return;
    }

    if (!kvkkAccepted) {
      setError(t("register.error.kvkkRequired"));
      return;
    }

    try {
      setLoading(true);
      await AuthApi.register(username, email, password);
      setSuccess(t("register.success.accountCreated"));
      setTimeout(() => navigate("/auth/login"), 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("register.error.registrationFailed")
      );
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md min-w-80 mx-auto animate-fade-in">
      <Card className="max-w-[20rem] min-h-[35rem]">
        <CardHeader>
          <CardTitle className="text-center">{t("register.title")}</CardTitle>
        </CardHeader>
        <CardContent>

        <form onSubmit={handleSubmit} className="space-y-4" aria-label={t("register.title")}>
          <div>
            <Label htmlFor="username" className="mb-1 block">{t("register.username.label")}</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required aria-required="true" placeholder={t("register.username.placeholder")} />
          </div>

          <div>
            <Label htmlFor="email" className="mb-1 block">{t("register.email.label")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required aria-required="true" placeholder={t("register.email.placeholder")} />
          </div>

          <div>
            <Label htmlFor="password" className="mb-1 block">{t("register.password.label")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-required="true"
              aria-describedby="password-requirements password-strength"
              placeholder={t("register.password.placeholder")}
            />
            <p id="password-requirements" className="mt-1 text-xs text-muted-foreground">
              {t("register.password.requirements")}
            </p>
              {password ? (
                <PasswordStrengthMeter password={password} id="password-strength" />
              ) : (
                <div className="mt-12.5" aria-hidden="true" />
              )}
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="mb-1 block">{t("register.confirmPassword.label")}</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required aria-required="true" placeholder={t("register.confirmPassword.placeholder")} />
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="kvkk"
              checked={kvkkAccepted}
              onChange={(e) => setKvkkAccepted(e.target.checked)}
              aria-required="true"
              className="mt-1 h-4 w-4 rounded border-input accent-primary focus:ring-primary"
            />
            <Label htmlFor="kvkk" className="text-sm font-normal leading-tight cursor-pointer">
              {t("register.kvkk.label")}
            </Label>
          </div>

          {error && (
            <Alert variant="destructive" className="p-3" role="alert" aria-live="assertive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="p-3" role="status" aria-live="polite">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            aria-disabled={loading}
            className="w-full"
          >
            {loading ? t("register.loading") : t("register.registerButton")}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("register.haveAccount")}{" "}
          {/* Use link-variant Button to follow theme tokens */}
          <Button
            type="button"
            variant="link"
            onClick={() => navigate("/auth/login")}
            className="px-0 h-auto align-baseline"
          >
            {t("register.login")}
          </Button>
        </p>
        </CardContent>
      </Card>
    </div>
  );
}


