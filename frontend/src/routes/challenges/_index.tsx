import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ChallengeListItem } from '@/lib/api/schemas/challenges';
import { UsersApi } from '@/lib/api/users';
import ChallengeCard from '@/components/challenges/challengeCard';
import CreateChallenge from '@/components/challenges/createChallenge';
import { Spinner } from '@/components/ui/spinner';



export default function ChallengesIndex() {

  const { t } = useTranslation();
  const [items, setItems] = useState<ChallengeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const username = useMemo(() => {
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
        setLoading(true);
        // Fetch challenges from API
        const response = await UsersApi.listChallenges(username); // Assuming this method exists
        setItems(response);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load challenges');
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  return (
      <div className="min-h-screen flex flex-col text-foreground">
        <div className="flex justify-end mb-6 mr-26 pt-10">
          <CreateChallenge />
        </div>
        <div className="flex-1 flex items-center justify-center pt-10 pb-10">
          {loading ? (
            <Spinner />
          ) : error ? (
            <div className="text-destructive">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="text-muted-foreground">
              {t('challenges.noChallenges', 'No challenges found.')}
            </div>
          ) : (
            <div className="w-full max-w-6xl">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <ChallengeCard key={item.challengeId} challenge={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
}