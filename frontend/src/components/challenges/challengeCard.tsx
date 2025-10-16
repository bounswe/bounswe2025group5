import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UsersApi } from '@/lib/api/users';
import { ChallengesApi } from '@/lib/api/challenges';
import { type ChallengeListItem } from '@/lib/api/schemas/challenges';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export default function ChallengeCard({ challenge }: { challenge: ChallengeListItem }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Record<number, boolean>>({});
  const [username, setUsername] = useState<string>(localStorage.getItem('username') || '');

  // a user leaves a challange with challengeId, meanwhile the challenge is set to busy
  const leave = async (challengeId: number, username: string) => {
    try {
      setBusy((b) => ({ ...b, [challengeId]: true }));
      await ChallengesApi.leave(challengeId, username);
    } catch (e) {
      console.error(e);
      alert(t('challenges.leaveError', 'Could not leave the challenge'));
    } finally {
      setBusy((b) => ({ ...b, [challengeId]: false }));
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card key={challenge.challengeId} className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-base">{challenge.name}</CardTitle>
          {challenge.description && <CardDescription>{challenge.description}</CardDescription>}
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <div className="flex justify-between"><span>{t('challenges.type', 'Type')}</span><span>{challenge.wasteType}</span></div>
          <div className="flex justify-between"><span>{t('challenges.status', 'Status')}</span><span>{challenge.status}</span></div>
          <div className="flex justify-between"><span>{t('challenges.dates', 'Dates')}</span><span>{challenge.startDate} → {challenge.endDate}</span></div>
          {challenge.amount != null && <div className="flex justify-between"><span>{t('challenges.target', 'Target')}</span><span>{challenge.amount}</span></div>}
        </CardContent>
        <div className="mt-auto p-4">
          <Button size="sm" variant="outline" disabled={!!busy[challenge.challengeId]} onClick={() => leave(challenge.challengeId, username)}>
            {busy[challenge.challengeId] ? t('challenges.leaving', 'Leaving...') : t('challenges.leave', 'Leave')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
