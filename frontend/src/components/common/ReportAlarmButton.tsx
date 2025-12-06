import { AlarmClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ReportAlarmButtonProps = {
  'aria-label'?: string;
  title?: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

export default function ReportAlarmButton({
  'aria-label': ariaLabel = 'Report content',
  title = ariaLabel,
  disabled,
  onClick,
  className,
}: ReportAlarmButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      className={cn(
        'h-12 w-12 rounded-full border-dashed border-foreground/60 bg-background text-foreground shadow-md transition hover:scale-105 hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-2 focus-visible:ring-destructive',
        className,
      )}
    >
      <AlarmClock className="h-6 w-6" strokeWidth={1.75} />
    </Button>
  );
}


