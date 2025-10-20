import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChallengesApi } from '@/lib/api/challenges';
import { type ChallengeListItem } from '@/lib/api/schemas/challenges';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '../ui/input';
import Leaderboard from './Leaderboard';

export default function ChallengeCard({ challenge }: { challenge: ChallengeListItem }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<Record<number, boolean>>({});
  const [logging, setLogging] = useState<Record<number, boolean>>({});
  const [username] = useState<string>(localStorage.getItem('username') || '');
  const [userInChallenge, setUserInChallenge] = useState<boolean>(challenge.userInChallenge);
  const [currentAmount, setCurrentAmount] = useState<number>(challenge.currentAmount ?? 0);
  const [logAmount, setLogAmount] = useState<number>(1);

  // a user attends a challange with challengeId, meanwhile the challenge is set to busy
  const attend = async (challengeId: number, username: string) => {
    try {
      setBusy((b) => ({ ...b, [challengeId]: true }));
      await ChallengesApi.attend(challengeId, { username });
    } catch (e) {
      console.error(e);
      alert(t('challenges.attendError', 'Could not attend the challenge'));
    } finally {
      setBusy((b) => ({ ...b, [challengeId]: false }));
      setUserInChallenge(true);
    }
  };

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
      setUserInChallenge(false);
    }
  };

  const logChallengeProgress = async (challengeId: number, username: string, amount: number) => {
    try {
      setLogging((b) => ({ ...b, [challengeId]: true }));
      const response = await ChallengesApi.logChallengeProgress(challengeId, { username, amount });
      if (response.newTotalAmount != null) {
        setCurrentAmount(prev => prev + amount); // consider this!!!! 
      }
    } catch (e) {
      console.error(e);
      alert(t('challenges.logError', 'Could not log challenge progress'));
    } finally {
      setLogging((b) => ({ ...b, [challengeId]: false }));
    }
  };

  return (
    <div className="grid gap-4 grid-cols-1">
      <Card key={challenge.challengeId} className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-base">{challenge.name}</CardTitle>
          {challenge.description && <CardDescription>{challenge.description}</CardDescription>}
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <div className="flex justify-between"><span>{t('challenges.type', 'Type')}</span><span>{challenge.type}</span></div>
          <div className="flex justify-between"><span>{t('challenges.status', 'Status')}</span><span>{challenge.status}</span></div>
          <div className="flex justify-between"><span>{t('challenges.dates', 'Dates')}</span><span>{challenge.startDate} → {challenge.endDate}</span></div>
          {challenge.amount != null && (
            <div className="flex flex-col">
              <div className="flex justify-between">
                <span>{t('challenges.amount', 'Amount')}</span>
                <span>{currentAmount} / {challenge.amount}</span>
              </div>
              <Progress value={challenge.amount > 0 ? (currentAmount / challenge.amount) * 100 : 0} className="mt-1" />
            </div>
          )}
        </CardContent>
        <div className="mt-auto p-4 flex justify-between">
          <div className="flex gap-2">
            {!userInChallenge? (
              <Button size="sm" variant="outline" className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/20" disabled={!!busy[challenge.challengeId] || !!logging[challenge.challengeId]} onClick={() => attend(challenge.challengeId, username)}>
                {busy[challenge.challengeId] ? t('challenges.attending', 'Attending...') : t('challenges.attend', 'Attend')}
              </Button>
            ) : (
              <Button size="sm" variant="destructive" disabled={!!busy[challenge.challengeId] || !!logging[challenge.challengeId]} onClick={() => leave(challenge.challengeId, username)}>
                {busy[challenge.challengeId] ? t('challenges.leaving', 'Leaving...') : t('challenges.leave', 'Leave')}
              </Button>
            )}
            <Popover> 
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20" disabled={!!logging[challenge.challengeId] || !!busy[challenge.challengeId]}>
                  {logging[challenge.challengeId] ? t('challenges.logging', 'Logging...') : t('challenges.log', 'Log')}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Input type="number" min={1} value={logAmount} onChange={e => {
                  const next = Number(e.target.value);
                  setLogAmount(isNaN(next) || next <= 0 ? 1 : next);
                }} />
                <Button size="sm" variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20 mt-5" disabled={!!logging[challenge.challengeId] || !!busy[challenge.challengeId]} onClick={() => logChallengeProgress(challenge.challengeId, username, Math.max(1, logAmount))}>
                  {logging[challenge.challengeId] ? t('challenges.logging', 'Logging...') : t('challenges.log', 'Log')}
                </Button>
              </PopoverContent>
            </Popover>
          </div>
          
          <Leaderboard challengeId={challenge.challengeId} />
        </div>
      </Card>
    </div>
  );
}
