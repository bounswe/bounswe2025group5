/**
 * Animation Demo Component
 * Showcases the global animation system usage
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { animations, presets, combineAnimations } from '@/lib/animations';
import { cn } from '@/lib/utils';

export default function AnimationDemo() {
  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold mb-8">WasteLess Animation System Demo</h1>
      
      {/* Button Animations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Button Animations</h2>
        <div className="flex gap-4 flex-wrap">
          <Button className="animate-button-primary">
            Primary Button
          </Button>
          <Button variant="secondary" className="animate-button-secondary">
            Secondary Button
          </Button>
          <Button variant="ghost" className="animate-button-ghost">
            Ghost Button
          </Button>
        </div>
      </section>

      {/* Card Animations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Card Animations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="animate-card-interactive p-6">
            <h3 className="font-semibold mb-2">Interactive Card</h3>
            <p className="text-muted-foreground">Hover for lift effect</p>
          </Card>
          <Card className="animate-card-clickable p-6">
            <h3 className="font-semibold mb-2">Clickable Card</h3>
            <p className="text-muted-foreground">Hover and click for scale</p>
          </Card>
          <Card className="animate-fade-in p-6">
            <h3 className="font-semibold mb-2">Fade In Card</h3>
            <p className="text-muted-foreground">Entrance animation</p>
          </Card>
        </div>
      </section>

      {/* Input Animations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Input Animations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input placeholder="Default input" className="animate-input" />
          <Input placeholder="Error input" className="animate-input-error border-red-500" />
          <Input placeholder="Success input" className="animate-input-success border-green-500" />
        </div>
      </section>

      {/* List Animations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">List Animations</h2>
        <div className="space-y-2">
          {['Item 1', 'Item 2', 'Item 3', 'Item 4'].map((item, index) => (
            <div
              key={item}
              className={cn(
                'p-4 bg-card rounded-lg border animate-list-item',
                `animation-delay-${index * 50}ms`
              )}
            >
              {item} - Staggered entrance
            </div>
          ))}
        </div>
      </section>

      {/* Navigation Animations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Navigation Animations</h2>
        <nav className="flex gap-4">
          <a href="#" className="animate-nav-link px-4 py-2 rounded-lg bg-primary/10">
            Nav Link 1
          </a>
          <a href="#" className="animate-nav-tab px-4 py-2 rounded-lg bg-secondary/10">
            Nav Tab 2
          </a>
          <a href="#" className="animate-nav-link px-4 py-2 rounded-lg bg-accent/10">
            Nav Link 3
          </a>
        </nav>
      </section>

      {/* Loading Animations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Loading Animations</h2>
        <div className="flex gap-4 items-center">
          <div className="w-8 h-8 bg-primary rounded-full animate-loading-pulse"></div>
          <div className="w-8 h-8 bg-secondary rounded-full animate-loading-spin border-2 border-transparent border-t-current"></div>
          <div className="w-8 h-8 bg-accent rounded-full animate-loading-bounce"></div>
        </div>
      </section>

      {/* Using TypeScript Animation System */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">TypeScript Animation System</h2>
        <div className="space-y-2">
          <Button className={presets.button.primary}>
            Preset Primary Button
          </Button>
          <Card className={presets.card.interactive + ' p-4'}>
            <p>Using preset card animation from TypeScript</p>
          </Card>
          <div className={combineAnimations(
            animations.hover.scale('md'),
            animations.active.scale,
            animations.focus.ring,
            animations.entrance.slideInUp
          )}>
            <p className="p-4 bg-muted rounded-lg">
              Combined animations using TypeScript utilities
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}