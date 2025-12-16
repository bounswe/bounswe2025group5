import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ScrollPanelProps {
  title: string;
  description?: string;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

export default function ScrollPanel({ title, description, className, contentClassName, children }: ScrollPanelProps) {
  return (
    <Card className={cn(className, "bg-[#68656015] backdrop-blur-md border border-white/20 shadow-2xl drop-shadow-lg dark:bg-gray-900/40 dark:border-gray-700/30 dark:shadow-black/50")}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-0">
        <div className={cn("overflow-y-auto max-h-[calc(100vh-17rem)] px-6 py-1", contentClassName)}>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}


