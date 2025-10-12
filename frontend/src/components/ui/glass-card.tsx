import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import * as React from 'react'

interface GlassCardProps extends React.ComponentProps<typeof Card> {
  variant?: 'default' | 'sm' | 'lg'
}

export default function GlassCard({ 
  variant = 'default', 
  className, 
  children, 
  ...props 
}: GlassCardProps) {
  const variants = {
    default: 'p-6 max-w-4xl min-h-[400px]',
    sm: 'p-4 max-w-md min-h-[200px]',
    lg: 'p-8 max-w-6xl min-h-[600px]'
  }

  return (
    <Card
      className={cn(
        // Base glass effect
        'bg-[#19181845] backdrop-blur-md border border-white/20 shadow-xl rounded-lg w-full',
        // Dark mode
        'dark:bg-gray-900/40 dark:border-gray-700/30',
        // Size variant
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </Card>
  )
}