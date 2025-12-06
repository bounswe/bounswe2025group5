import { AlarmClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ReportAlarmButtonProps = {
  'aria-label'?: string;
  title?: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md';
};

export default function ReportAlarmButton({
  'aria-label': ariaLabel = 'Report content',
  title = ariaLabel,
  disabled,
  onClick,
  className,
  size = 'md',
}: ReportAlarmButtonProps) {
  const buttonSize = size === 'sm' ? 'h-9 w-9' : 'h-12 w-12';
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';

  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      className={cn(
        buttonSize,
        'rounded-full border-dashed border-foreground/60 bg-background text-foreground shadow-md transition hover:scale-105 hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-2 focus-visible:ring-destructive',
        className,
      )}
    >
      <AlarmClock className={cn(iconSize)} strokeWidth={1.75} />
    </Button>
  );
}


