import { Button } from '@/components/ui/button';
import { Palette, Sun, Moon } from 'lucide-react';

export default function ThemeColorTesting() {
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8 bg-card rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Palette className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">WasteLess Theme Color Testing</h2>
        </div>
        <Button variant="outline" size="sm" onClick={toggleDarkMode}>
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      {/* Button Variants Row */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Button Variants</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="default">Primary (Default)</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      {/* Button Sizes */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Button Sizes</h3>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="default">Small</Button>
          <Button size="default" variant="default">Default</Button>
          <Button size="lg" variant="default">Large</Button>
          <Button size="icon" variant="default">
            <Palette className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Custom Theme Colors */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Custom Theme Colors</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Primary Green */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Primary Green</p>
            <Button className="w-full bg-primary hover:bg-primary/90">Primary</Button>
            <div className="h-8 bg-primary rounded border"></div>
          </div>

          {/* Secondary Blue */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Secondary Blue</p>
            <Button className="w-full bg-secondary hover:bg-secondary/90">Secondary</Button>
            <div className="h-8 bg-secondary rounded border"></div>
          </div>

          {/* Accent Yellow */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Accent Yellow</p>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Accent</Button>
            <div className="h-8 bg-accent rounded border"></div>
          </div>

          {/* Success Green */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Success</p>
            <Button className="w-full bg-[var(--success)] text-white hover:bg-[var(--success)]/90">Success</Button>
            <div className="h-8 bg-[var(--success)] rounded border"></div>
          </div>
        </div>
      </section>

      {/* WasteLess Brand Colors with hex values */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-muted-foreground">WasteLess Brand Palette</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Deep Green */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Deep Green</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">#1A8A41</code>
            </div>
            <Button className="w-full bg-[#1A8A41] hover:bg-[#1A8A41]/90 text-white">
              Primary Action
            </Button>
          </div>

          {/* Calm Blue */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Calm Blue</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">#0E9DCF</code>
            </div>
            <Button className="w-full bg-[#0E9DCF] hover:bg-[#0E9DCF]/90 text-white">
              Secondary Action
            </Button>
          </div>

          {/* Golden Yellow */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Golden Yellow</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">#F8B82A</code>
            </div>
            <Button className="w-full bg-[#F8B82A] hover:bg-[#F8B82A]/90 text-black">
              Accent Action
            </Button>
          </div>

          {/* Soft Green */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Soft Green</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">#86C05A</code>
            </div>
            <Button className="w-full bg-[#86C05A] hover:bg-[#86C05A]/90 text-white">
              Success State
            </Button>
          </div>

          {/* Warm Base */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Warm Base</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">#FEF9EA</code>
            </div>
            <Button className="w-full bg-[#FEF9EA] hover:bg-[#FEF9EA]/90 text-black border">
              Light Background
            </Button>
          </div>
        </div>
      </section>

      {/* Color Combinations */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Color Combinations</h3>
        <div className="flex flex-wrap gap-3">
          <Button className="bg-gradient-to-r from-primary to-secondary text-white">
            Primary → Secondary
          </Button>
          <Button className="bg-gradient-to-r from-secondary to-accent text-white">
            Secondary → Accent
          </Button>
          <Button className="bg-gradient-to-r from-accent to-[var(--success)] text-white">
            Accent → Success
          </Button>
          <Button className="bg-gradient-to-r from-primary to-accent text-white">
            Primary → Accent
          </Button>
        </div>
      </section>

      {/* Interactive States */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Interactive States</h3>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Normal</Button>
            <Button variant="default" className="hover:bg-primary/90">Hover (simulate)</Button>
            <Button variant="default" disabled>Disabled</Button>
            <Button variant="default" className="focus-visible:ring-2 focus-visible:ring-ring">Focus</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">Outline Normal</Button>
            <Button variant="outline" className="hover:bg-accent hover:text-accent-foreground">Outline Hover</Button>
            <Button variant="outline" disabled>Outline Disabled</Button>
          </div>
        </div>
      </section>

      {/* Color Information */}
      <section className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
        <p className="font-medium mb-2">Color System Info:</p>
        <ul className="space-y-1">
          <li>• Colors use OKLCH color space for better perceptual uniformity</li>
          <li>• Automatic dark mode variants with proper contrast ratios</li>
          <li>• Focus rings and accessibility states included</li>
          <li>• Hover states with 90% opacity for consistent feel</li>
        </ul>
      </section>
    </div>
  );
}