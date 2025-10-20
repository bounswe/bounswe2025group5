import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import * as React from 'react'

interface GlassCardProps extends React.ComponentProps<typeof Card> {
  variant?: 'default' | 'sm' | 'lg'
  interactive?: boolean
  clickable?: boolean
}

export default function GlassCard({ 
  variant = 'default', 
  interactive = false,
  clickable = false,
  className, 
  children, 
  ...props 
}: GlassCardProps) {
  const variants = {
    default: 'p-8 max-w-4xl min-h-[400px] min-w-[50rem]',
    sm: 'p-6 max-w-md min-h-[200px]',
    lg: 'p-12 max-w-6xl min-h-[600px]'
  }

  return (
    <Card
      className={cn(
        // Base glass effect with custom shadow
        'bg-[#2a1a0540] backdrop-blur-md border border-white/20 rounded-lg w-full',
        // Smooth size transition animations with overflow handling
        'transition-[width,height,min-height,max-height,padding] duration-700 ease-out overflow-hidden',
        // Custom shadow
        'shadow-2xl drop-shadow-lg',
        // Dark mode
        'dark:bg-gray-900/40 dark:border-gray-700/30 dark:shadow-black/50',
        // Size variant
        variants[variant],
        // Animation variants (only for interactive/clickable, no default animation)
        interactive && 'animate-card-interactive',
        clickable && 'animate-card-clickable',
        className
      )}
      {...props}
    >
      {children}
    </Card>
  )
}