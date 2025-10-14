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
    <Card className={cn(className, "bg-transparent backdrop-blur-sm border border-white/20")}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-0">
        <div className={cn("overflow-y-auto max-h-[calc(100vh-12rem)] px-6 py-4", contentClassName)}>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}


