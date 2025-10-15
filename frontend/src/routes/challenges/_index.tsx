
import React from 'react';
import { useTranslation } from 'react-i18next';
import ChallengeCard from '@/components/challenges/challengeCard';
import { type ChallengeListItem } from '@/lib/api/schemas/challenges';
import { ChallengesApi } from '@/lib/api/challenges';
import { UsersApi } from '@/lib/api/users';


export default function ChallengesIndex() {

  const { t } = useTranslation();
  const [items, setItems] = React.useState<ChallengeListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const username = React.useMemo(() => {
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
  React.useEffect(() => {
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
      <div className="min-h-screen flex items-center justify-center text-foreground">
        {loading ? (
          <div className="min-h-screen flex items-center justify-center text-foreground">
            {t('challenges.loading', 'Loading...')}
          </div>
        ) : error ? (
          <div className="min-h-screen flex items-center justify-center text-destructive">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="min-h-screen flex items-center justify-center text-muted-foreground">
            {t('challenges.noChallenges', 'No challenges found.')}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ChallengeCard challenge={item} />
            ))}
          </div>
        )}
      </div>
    );
}