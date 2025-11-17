import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChallengesApi } from '@/lib/api/challenges';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { LeaderboardItem } from '@/lib/api/schemas/leaderboard';

export default function Leaderboard({ challengeId }: { challengeId: number }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await ChallengesApi.getLeaderboard(challengeId);
        setLeaderboardEntries(response);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
  })();
  }, [challengeId]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-4 text-xs" onClick={(e) => e.stopPropagation()}>
          {t('challenges.leaderboard', 'Leaderboard')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('challenges.leaderboard', 'Leaderboard')}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="mt-4">
            {leaderboardEntries.length ? (
              <div className="max-h-120 overflow-y-auto pr-2">
                <ul className="divide-y divide-border">
                  {leaderboardEntries.map((item, index) => (
                    <li key={item.username} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">#{index + 1}</span>
                        <span>{item.username}</span>
                      </div>
                      <span>{item.logAmount}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('challenges.leaderboardEmpty', 'No entries yet')}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
