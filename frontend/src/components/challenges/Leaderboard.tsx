import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChallengesApi } from '@/lib/api/challenges';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogOverlay, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import type { LeaderboardItem } from '@/lib/api/schemas/leaderboard';

export default function Leaderboard({ challengeId }: { challengeId: number }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [LeaderboardEntries, setLeaderboardEntries] = useState<LeaderboardItem[]>([]);

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
        <Button variant="outline">{t('challenges.leaderboard', 'Leaderboard')}</Button>
      </DialogTrigger>
      <DialogOverlay />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('challenges.leaderboard', 'Leaderboard')}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <Spinner />
        ) : (
          <ul>
            {LeaderboardEntries.map((item, index) => (
              <li key={item.username} className="flex justify-between py-2 border-b">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">#{index + 1}</span>
                  <span>{item.username}</span>
                </div>
                <span>{item.logAmount}</span>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
