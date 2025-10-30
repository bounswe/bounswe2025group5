import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UsersApi } from '@/lib/api/users';
import { PostsApi } from '@/lib/api/posts';
import { Spinner } from '@/components/ui/spinner';
import ScrollPanel from '@/components/mainpage/ScrollPanel';
import ChallengeCard from '@/components/challenges/challengeCard';
import type { PostItem } from '@/lib/api/schemas/posts';
import PostCard from '@/components/feedpage/post-card';

export default function MainpageIndex() {
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
        setChallenges(chs.filter((c: any) => c.userInChallenge));
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
  const handlePostUpdate = (updatedPost: PostItem) => {
    setPosts(prev =>
      prev.map(post =>
        post.postId === updatedPost.postId ? updatedPost : post
      )
    );
  };

  const handlePostDelete = (postId: number) => {
    setPosts(prev => prev.filter(post => post.postId !== postId));
  };

  return (
    <div className="container mx-auto px-4 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScrollPanel
          title={t('mainpage.challengesTitle', 'Your Challenges')}
          description={t('mainpage.challengesDesc', 'Challenges you are currently attending')}
        >
          {challenges.length === 0 ? (
            <div className="text-muted-foreground">{t('mainpage.noChallenges', 'No active challenges')}</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 px-4">
              {challenges.map((ch) => (
                <ChallengeCard key={ch.challengeId} challenge={ch} />
              ))}
            </div>
          )}
        </ScrollPanel>

        <ScrollPanel
          title={t('mainpage.feedTitle', 'Following Feed')}
          description={t('mainpage.feedDesc', 'Recent posts from accounts you follow')}
        >
          {posts.length === 0 ? (
            <div className="text-muted-foreground">{t('mainpage.noPosts', 'No posts yet')}</div>
          ) : (
            <div className="space-y-4 grid gap-4 sm:grid-cols-2">
              {posts.map((p) => (
                <PostCard key={p.postId} post={p} onPostUpdate={handlePostUpdate} onPostDelete={handlePostDelete} />
              ))}
            </div>
          )}
        </ScrollPanel>
      </div>
    </div>
  );
}


