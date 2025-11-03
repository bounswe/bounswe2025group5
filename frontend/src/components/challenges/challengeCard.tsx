import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChallengesApi } from '@/lib/api/challenges';
import { type ChallengeListItem } from '@/lib/api/schemas/challenges';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '../ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
    <Card className="w-full py-3">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="challenge-details" className="border-none">
          <div className="px-3 py-1.5 flex flex-col h-full">
            {/* Top section - Title and visualization */}
            <div className="flex items-start gap-4 mb-1">
              {/* Left side - Title */}
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base">{challenge.name}</CardTitle>
                {challenge.description && (
                  <CardDescription className="text-xs mt-1 line-clamp-2">
                    {challenge.description}
                  </CardDescription>
                )}
              </div>
              
              {/* Right side - Larger Visualization */}
              <div className="flex items-center shrink-0">
                {challenge.amount != null && (
                  <RecyclingProgressVisualization 
                    progress={challenge.amount > 0 ? (currentAmount / challenge.amount) * 100 : 0}
                    width={160}
                    height={120}
                    className="rounded-lg"
                  />
                )}
              </div>
            </div>
            
            {/* Spacer to push buttons to bottom */}
            <div className="flex-grow" />
            
            {/* Bottom section - Action buttons */}
            <div className="relative flex gap-1.5 justify-center pt-1">
              {!userInChallenge ? (
                <Button 
                  size="sm" 
                  variant="default" 
                  className="h-8 btn-attend px-4 text-xs"
                  disabled={!!busy[challenge.challengeId] || !!logging[challenge.challengeId]} 
                  onClick={(e) => {
                    e.stopPropagation();
                    attend(challenge.challengeId, username);
                  }}
                >
                  {busy[challenge.challengeId] ? t('challenges.attending', 'Attending...') : t('challenges.attend', 'Attend')}
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="destructive" 
                  className="h-8 px-4 text-xs"
                  disabled={!!busy[challenge.challengeId] || !!logging[challenge.challengeId]} 
                  onClick={(e) => {
                    e.stopPropagation();
                    leave(challenge.challengeId, username);
                  }}
                >
                  {busy[challenge.challengeId] ? t('challenges.leaving', 'Leaving...') : t('challenges.leave', 'Leave')}
                </Button>
              )}
              
              <Popover> 
                <PopoverTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="h-8 px-4 text-xs"
                    disabled={!!logging[challenge.challengeId] || !!busy[challenge.challengeId]}
                    onClick={(e) => e.stopPropagation()}
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
                      {logging[challenge.challengeId] ? t('challenges.logging', 'Logging...') : t('challenges.submit', 'Submit')}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Leaderboard challengeId={challenge.challengeId} />
              
              {/* Accordion trigger - bottom right corner */}
              <AccordionTrigger className="absolute -bottom-1 -right-2 hover:no-underline p-2 rounded-full hover:bg-accent transition-colors" />
            </div>
          </div>
          
          <AccordionContent>
            <CardContent className="text-sm text-muted-foreground space-y-2 pt-0">
              {/* Description - Full text when expanded */}
              {challenge.description && (
                <div className="pb-2 border-b">
                  <p className="text-sm">{challenge.description}</p>
                </div>
              )}
              
              {/* Challenge Details */}
              <div className="flex justify-between">
                <span>{t('challenges.type', 'Type')}</span>
                <span className="font-medium">{challenge.type}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('challenges.status', 'Status')}</span>
                <span className="font-medium">{challenge.status}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('challenges.dates', 'Dates')}</span>
                <span className="font-medium text-xs">{challenge.startDate} → {challenge.endDate}</span>
              </div>
              
              {/* Progress Bar */}
              {challenge.amount != null && (
                <div className="pt-2">
                  <Progress value={challenge.amount > 0 ? (currentAmount / challenge.amount) * 100 : 0} />
                </div>
              )}
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
