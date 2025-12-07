import { AlertTriangle } from 'lucide-react';
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
  const buttonSize = size === 'sm' ? 'h-8 w-8' : 'h-12 w-12';
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      className={cn(
        buttonSize,
        'hover:bg-[#e80e0e24] hover:text-red-600 transition-colors',
        className,
      )}
    >
      <AlertTriangle className={cn(iconSize)} />
    </Button>
  );
}


