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
import RecyclingProgressVisualization from './RecyclingProgressVisualization';

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
        <CardContent className="text-sm text-muted-foreground space-y-1 flex-grow">
          <div className="flex justify-between"><span>{t('challenges.type', 'Type')}</span><span>{challenge.type}</span></div>
          <div className="flex justify-between"><span>{t('challenges.status', 'Status')}</span><span>{challenge.status}</span></div>
          <div className="flex justify-between"><span>{t('challenges.dates', 'Dates')}</span><span>{challenge.startDate} → {challenge.endDate}</span></div>
          {challenge.amount != null && (
            <div className="flex justify-between">
              <span>{t('challenges.amount', 'Amount')}</span>
              <span>{currentAmount} / {challenge.amount}</span>
            </div>
          )}
        </CardContent>
        
        {/* Fixed position visualization section */}
        {challenge.amount != null && (
          <div className="p-4 pt-0 space-y-3">
            {/* Recycling Progress Visualization */}
            <div className="flex justify-center">
              <RecyclingProgressVisualization 
                progress={challenge.amount > 0 ? (currentAmount / challenge.amount) * 100 : 0}
                width={320}
                height={180}
                className="rounded-lg shadow-sm"
              />
            </div>
            
            <Progress value={challenge.amount > 0 ? (currentAmount / challenge.amount) * 100 : 0} className="mt-1" />
          </div>
        )}
        
        <div className="mt-auto p-4 pt-2 space-y-4">
          {/* Action buttons row */}
          <div className="flex gap-2 w-full">
            {!userInChallenge ? (
              <Button 
                size="sm" 
                variant="default" 
                className="flex-1 h-9 btn-attend"
                disabled={!!busy[challenge.challengeId] || !!logging[challenge.challengeId]} 
                onClick={() => attend(challenge.challengeId, username)}
              >
                {busy[challenge.challengeId] ? t('challenges.attending', 'Attending...') : t('challenges.attend', 'Attend')}
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="destructive" 
                className="flex-1 h-9"
                disabled={!!busy[challenge.challengeId] || !!logging[challenge.challengeId]} 
                onClick={() => leave(challenge.challengeId, username)}
              >
                {busy[challenge.challengeId] ? t('challenges.leaving', 'Leaving...') : t('challenges.leave', 'Leave')}
              </Button>
            )}
            
            <Popover> 
              <PopoverTrigger asChild>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="flex-1 h-9"
                  disabled={!!logging[challenge.challengeId] || !!busy[challenge.challengeId]}
                >
                  {logging[challenge.challengeId] ? t('challenges.logging', 'Logging...') : t('challenges.log', 'Log')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="space-y-3">
                  <Input 
                    type="number" 
                    min={1} 
                    value={logAmount} 
                    onChange={e => {
                      const next = Number(e.target.value);
                      setLogAmount(isNaN(next) || next <= 0 ? 1 : next);
                    }} 
                    className="h-9"
                  />
                  <Button 
                    size="sm" 
                    variant="default" 
                    className="w-full h-9 btn-log-submit" 
                    disabled={!!logging[challenge.challengeId] || !!busy[challenge.challengeId]} 
                    onClick={() => logChallengeProgress(challenge.challengeId, username, Math.max(1, logAmount))}
                  >
                    {logging[challenge.challengeId] ? t('challenges.logging', 'Logging...') : t('challenges.log', 'Log')}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Leaderboard section - centered */}
          <div className="w-full flex justify-center">
            <Leaderboard challengeId={challenge.challengeId} />
          </div>
        </div>
      </Card>
    </div>
  );
}
