import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { UsersApi } from "@/lib/api/users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import DeleteAccount from "@/components/profile/delete_account";
import EditProfile from "@/components/profile/edit_profile";

export default function ProfileIndex() {
  const { t } = useTranslation();
  const [username, setUsername] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="max-w-2xl mx-auto mt-24 space-y-6">
        {/* Profile Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-muted border border-border">
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-muted-foreground">{t('profile.noPhoto', 'No photo')}</div>
                )}
              </div>
              <div>
                <div className="text-xl font-semibold">{username}</div>
                <div className="text-muted-foreground mt-1">{bio || t('profile.noBio', 'No bio yet')}</div>
              </div>
              <div className="flex gap-3">
                <EditProfile
                  username={username}
                  initialBio={bio}
                  initialPhotoUrl={photoUrl}
                  onBioSaved={(newBio) => setBio(newBio)}
                  onPhotoSaved={(newUrl) => setPhotoUrl(newUrl)}
                />
                <DeleteAccount />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts Placeholder Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.posts', 'Posts')}</CardTitle>
            <CardDescription>{t('profile.postsDesc', 'User posts will appear here')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground">{t('profile.postsPlaceholder', 'Post list not implemented yet')}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


