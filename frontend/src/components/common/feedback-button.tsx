import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FeedbackDialog from './feedback-dialog';
import { cn } from '@/lib/utils';

interface FeedbackButtonProps {
  className?: string;
}

export default function FeedbackButton({ className }: FeedbackButtonProps) {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        className={cn(
          'fixed bottom-6 left-6 z-50 ring-2 ring-foreground/80 hover:ring-foreground rounded-full h-14 w-14 shadow-xl hover:shadow-xl transition-all duration-200',
          'bg-tertiary hover:bg-tertiary',
          className
        )}
        aria-label={t('feedback.buttonLabel')}
        title={t('feedback.buttonLabel')}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      <FeedbackDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}
