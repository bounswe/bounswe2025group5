import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { AuthApi, setTokens, setAuthMetadata } from "@/lib/api/auth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Login() {
  const { t } = useTranslation();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await AuthApi.login(emailOrUsername, password);
      setTokens(response.token, response.refreshToken);
      setAuthMetadata({
        username: response.username,
        isModerator: response.isModerator,
      });
      navigate("/"); // Redirect to home after successful login
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md min-w-80 mx-auto animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>{t("login.title")}</CardTitle>
          <CardDescription>
            {t("login.description")}
          </CardDescription>
          <CardAction>
            <Button variant="secondary" onClick={() => navigate('/auth/register')}>
              {t("login.signup")}
            </Button>
          </CardAction>
        </CardHeader>
     <CardContent>
         <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">{t("login.email.label")} / {t("login.username")}</Label>
              <Input
                id="email"
                placeholder={t("login.email.placeholder")}
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">{t("login.password.label")}</Label>
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  {t("login.password.forgot")}
                </a>
              </div>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
         </form>
      </CardContent>
       <CardFooter className="flex-col gap-2">
         <Button form="login-form" type="submit" className="w-full" disabled={loading}>
          {loading ? t("login.loading") : t("login.loginButton")}
        </Button>
      </CardFooter>
      </Card>
    </div>
  );
}

