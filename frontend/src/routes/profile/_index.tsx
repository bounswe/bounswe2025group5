import { useEffect, useMemo, useState, type FormEvent, useRef } from "react";
import { useTranslation } from "react-i18next";
import { UsersApi } from "@/lib/api/users";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function ProfileIndex() {
  const { t } = useTranslation();
  const [username, setUsername] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Pull username from token payload stored in localStorage via API client refresh
  const storedUsername = useMemo(() => {
    try {
      const raw = localStorage.getItem("username");
      if (raw) return raw;
      const token = localStorage.getItem('authToken');
      if (!token) return null;
      const [, payload] = token.split('.');
      if (!payload) return null;
      const json = JSON.parse(atob(payload));
      // backend sets claim "username" in token
      return typeof json.username === 'string' ? json.username : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!storedUsername) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    setUsername(storedUsername);
    (async () => {
      try {
        const p = await UsersApi.getProfile(storedUsername);
        setBio(p.biography ?? "");
        setPhotoUrl(p.photoUrl ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [storedUsername]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!username) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await UsersApi.updateProfile(username, bio);
      setBio(updated.biography ?? "");
      setPhotoUrl(updated.photoUrl ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onPickPhoto = () => fileInputRef.current?.click();
  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (ev) => {
    if (!username) return;
    const file = ev.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await UsersApi.uploadProfilePhoto(username, file);
      setPhotoUrl(updated.photoUrl ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to upload photo");
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-foreground">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto mt-24">
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.title')}</CardTitle>
            <CardDescription>{t('profile.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <div className="shrink-0">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-muted border border-border">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-muted-foreground">{t('profile.noPhoto', 'No photo')}</div>
                  )}
                </div>
                <div className="mt-3">
                  <Button variant="outline" onClick={onPickPhoto} disabled={saving}>
                    {t('profile.changePhoto')}
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                </div>
              </div>

              <form className="flex-1 space-y-4" onSubmit={onSave}>
                <div>
                  <Label>{t('profile.username')}</Label>
                  <Input value={username ?? ''} disabled />
                </div>

                <div>
                  <Label>{t('profile.biography')}</Label>
                  <Input value={bio} onChange={e => setBio(e.target.value)} placeholder={t('profile.bioPlaceholder', 'Tell us about yourself')} />
                </div>

                <CardFooter className="px-0">
                  <Button type="submit" disabled={saving}>
                    {saving ? t('profile.saving') : t('profile.save')}
                  </Button>
                </CardFooter>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


