import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ReportsApi } from '@/lib/api/reports';
import { USERNAME_KEY } from '@/lib/api/client';
import { toast } from 'sonner';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { t } = useTranslation();
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error(t('feedback.emptyError'));
      return;
    }

    const username = localStorage.getItem(USERNAME_KEY);
    if (!username) {
      toast.error(t('feedback.authError'));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        reporterName: username,
        description: `${description.trim()}`,
        type: 'OTHER',
        contentType: 'POST',
        objectId: -1,
      };
      
      console.log('Submitting feedback:', payload);
      await ReportsApi.create(payload);

      toast.success(t('feedback.success'));
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      
      // Show specific error message if available
      const errorMessage = error instanceof Error 
        ? error.message 
        : t('feedback.error');
      
      console.log('Error message:', errorMessage);
      
      // Check for common error patterns
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        toast.error(t('feedback.forbiddenError'));
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        toast.error(t('feedback.authError'));
      } else if (errorMessage.includes('not found')) {
        toast.error(t('feedback.userNotFoundError'));
      } else {
        toast.error(errorMessage.includes('API Error') ? t('feedback.error') : errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('feedback.title')}</DialogTitle>
          <DialogDescription>{t('feedback.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-message">{t('feedback.messageLabel')}</Label>
            <Textarea
              id="feedback-message"
              placeholder={t('feedback.placeholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[150px] resize-none"
              disabled={isSubmitting}
              maxLength={500}
            />
            <p className="text-sm text-muted-foreground">
              {t('feedback.charCount', { count: description.length, max: 500 })}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !description.trim()}>
            {isSubmitting ? t('feedback.submitting') : t('common.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
