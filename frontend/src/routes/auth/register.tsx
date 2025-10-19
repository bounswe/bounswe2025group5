import { useState, type FormEvent } from "react";
import { AuthApi } from "@/lib/api/auth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";


export default function Register() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await AuthApi.register(username, email, password);
      setSuccess("Account created successfully. Redirecting to login...");
      setTimeout(() => navigate("/auth/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto py-16 px-4 min-h-screen grid place-items-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{t("register.title")}</CardTitle>
          </CardHeader>
          <CardContent>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username" className="mb-1 block">{t("register.username.label")}</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder={t("register.username.placeholder")} />
          </div>

          <div>
            <Label htmlFor="email" className="mb-1 block">{t("register.email.label")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={t("register.email.placeholder")} />
          </div>

          <div>
            <Label htmlFor="password" className="mb-1 block">{t("register.password.label")}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder={t("register.password.placeholder")} />
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="mb-1 block">{t("register.confirmPassword.label")}</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder={t("register.confirmPassword.placeholder")} />
          </div>

          {error && (
            <div className="text-red-600 bg-red-50 p-3 rounded text-sm">{error}</div>
          )}

          {success && (
            <div className="text-green-700 bg-green-50 p-3 rounded text-sm">{success}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn("w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors", loading && "opacity-60 cursor-not-allowed")}
          >
            {loading ? t("register.loading") : t("register.registerButton")}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-700">
          {t("register.haveAccount")}{" "}
          <a href="/auth/login" className="text-blue-600 hover:underline">{t("register.login")}</a>
        </p>
          </CardContent>
        </Card>
    </div>
  );
}


