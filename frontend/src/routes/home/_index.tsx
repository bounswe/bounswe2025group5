import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UsersApi } from '@/lib/api/users';
import { PostsApi } from '@/lib/api/posts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

export default function HomeIndex() {
  const { t } = useTranslation();
  const [_username, setUsername] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storedUsername = useMemo(() => {
    try {
      const raw = localStorage.getItem('username');
      if (raw) return raw;
      const token = localStorage.getItem('authToken');
      if (!token) return null;
      const [, payload] = token.split('.');
      if (!payload) return null;
      const json = JSON.parse(atob(payload));
      return typeof json.username === 'string' ? json.username : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!storedUsername) throw new Error('Not authenticated');
        setUsername(storedUsername);
        const [chs, feed] = await Promise.all([
          UsersApi.listChallenges(storedUsername),
          PostsApi.list({ size: 10, username: storedUsername }),
        ]);
        setChallenges(chs);
        setPosts(feed);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
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
    <div className="container mx-auto px-4 pb-10 space-y-8">
      <section>
        <Card>
          <CardHeader>
            <CardTitle>{t('home.challengesTitle', 'Your Challenges')}</CardTitle>
            <CardDescription>{t('home.challengesDesc', 'Challenges you are currently attending')}</CardDescription>
          </CardHeader>
          <CardContent>
            {challenges.length === 0 ? (
              <div className="text-muted-foreground">{t('home.noChallenges', 'No active challenges')}</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {challenges.map((ch) => (
                  <Card key={ch.challengeId}>
                    <CardHeader>
                      <CardTitle className="text-base">{ch.name}</CardTitle>
                      <CardDescription>{ch.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <div className="flex justify-between"><span>{t('home.type', 'Type')}</span><span>{ch.wasteType}</span></div>
                      <div className="flex justify-between"><span>{t('home.status', 'Status')}</span><span>{ch.status}</span></div>
                      <div className="flex justify-between"><span>{t('home.dates', 'Dates')}</span><span>{ch.startDate} → {ch.endDate}</span></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>{t('home.feedTitle', 'Following Feed')}</CardTitle>
            <CardDescription>{t('home.feedDesc', 'Recent posts from accounts you follow')}</CardDescription>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <div className="text-muted-foreground">{t('home.noPosts', 'No posts yet')}</div>
            ) : (
              <div className="space-y-4">
                {posts.map((p) => (
                  <Card key={p.postId}>
                    <CardHeader>
                      <CardTitle className="text-base">@{p.creatorUsername}</CardTitle>
                      <CardDescription>{new Date(p.createdAt).toLocaleString()}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {p.photoUrl && (
                        <img src={p.photoUrl} alt="post" className="w-full rounded-lg border" />
                      )}
                      <p className="text-foreground text-sm">{p.content}</p>
                      <div className="text-sm text-muted-foreground">{t('home.likes', 'Likes')}: {p.likes ?? 0} · {t('home.comments', 'Comments')}: {p.comments ?? 0}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}


