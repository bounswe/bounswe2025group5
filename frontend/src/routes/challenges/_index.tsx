import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ChallengeListItem } from '@/lib/api/schemas/challenges';
import { UsersApi } from '@/lib/api/users';
import ChallengeCard from '@/components/challenges/challengeCard';
import CreateChallenge from '@/components/challenges/createChallenge';
import { Spinner } from '@/components/ui/spinner';
import GlassCard from '@/components/ui/glass-card';



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
      <div className="min-h-screen pt-32 pb-8 px-4">
        <div className="max-w-6xl mx-auto flex justify-center">
          <GlassCard className="w-full">
            {/* Create Challenge Button - Centered below navbar */}
            <div className="flex justify-center mb-4">
              <CreateChallenge />
            </div>
            
            {/* Content */}
            {loading ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="text-center">
                  <Spinner className="h-8 w-8 mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('challenges.loading', 'Loading challenges...')}</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="text-center">
                  <p className="text-destructive">{error}</p>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="text-center">
                  <p className="text-muted-foreground text-lg">
                    {t('challenges.noChallenges', 'No challenges found.')}
                  </p>
                  <p className="text-muted-foreground/70 text-sm mt-2">
                    {t('challenges.createFirst', 'Create the first challenge to get started!')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => (
                  <ChallengeCard key={item.challengeId} challenge={item} />
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    );
}