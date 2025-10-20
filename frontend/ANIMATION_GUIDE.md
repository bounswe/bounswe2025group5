# WasteLess Global Animation System

## 🎯 **Overview**

This comprehensive animation system provides consistent, reusable animations across the entire WasteLess platform. All animations are centralized, making them easy to maintain and customize globally.

## 📚 **Quick Start**

### **1. Using CSS Classes (Simplest)**
```tsx
// Buttons
<Button className="animate-button-primary">Primary Button</Button>
<Button className="animate-button-secondary">Secondary Button</Button>

// Cards
<Card className="animate-card-interactive">Interactive Card</Card>
<GlassCard interactive>Auto-animated Glass Card</GlassCard>

// Inputs
<Input className="animate-input" />
```

### **2. Using TypeScript System (Advanced)**
```tsx
import { animations, presets } from '@/lib/animations';

// Using presets
<Button className={presets.button.primary}>Button</Button>
<Card className={presets.card.interactive}>Card</Card>

// Using individual animations
<div className={animations.hover.scale('md')}>Hover to scale</div>
```

## 🎨 **Available Animation Classes**

### **Button Animations**
- `animate-button-primary` - Scale on hover, press effect, focus ring
- `animate-button-secondary` - Lift on hover, push on press, focus ring  
- `animate-button-ghost` - Brightness on hover, dim on press, glow focus

### **Card Animations**
- `animate-card-interactive` - Lift and glow on hover
- `animate-card-clickable` - Scale on hover and press (for clickable cards)
- `animate-fade-in` - Smooth entrance animation

### **Input Animations**
- `animate-input` - Standard focus ring and transitions
- `animate-input-error` - Red focus ring for error states
- `animate-input-success` - Green focus ring for success states

### **List Animations**
- `animate-list-item` - Lift effect on hover
- `animate-list-item-interactive` - Scale and press effects

### **Navigation Animations**
- `animate-nav-link` - Brightness on hover
- `animate-nav-tab` - Lift and push effects

### **Loading Animations**
- `animate-loading-pulse` - Pulsing effect
- `animate-loading-spin` - Rotating spinner
- `animate-loading-bounce` - Bouncing effect

### **Entrance Animations**
- `animate-fade-in` - Fade in entrance
- `animate-slide-up` - Slide up from bottom
- `animate-slide-down` - Slide down from top
- `animate-scale-in` - Scale in entrance

## ⚡ **Enhanced Components**

### **GlassCard with Animations**
```tsx
// Basic animated card
<GlassCard>Static card with fade-in</GlassCard>

// Interactive card (hover effects)
<GlassCard interactive>Hover me!</GlassCard>

// Clickable card (scale and press effects)  
<GlassCard clickable onClick={handleClick}>Click me!</GlassCard>
```

## 🔧 **Staggered Animations**

For lists with staggered entrance animations:

```tsx
{items.map((item, index) => (
  <div
    key={item.id}
    className={`animate-slide-up animation-delay-${index * 50}ms`}
  >
    {item.content}
  </div>
))}
```

Available delays: `animation-delay-50` through `animation-delay-500` (50ms increments)

## 🎛️ **Customization**

### **Global Duration Changes**
Modify in `src/index.css`:
```css
.duration-fast { transition-duration: 150ms; }    /* Default: 150ms */
.duration-normal { transition-duration: 300ms; }  /* Default: 300ms */
.duration-slow { transition-duration: 500ms; }    /* Default: 500ms */
```

### **Custom Easing**
```css
.ease-spring { transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.ease-bounce { transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55); }
```

## 📖 **Best Practices**

### **✅ Do**
- Use CSS classes for consistent animations
- Apply entrance animations to page sections
- Use interactive animations for user-actionable elements
- Combine stagger delays for list animations

### **❌ Don't**
- Create inline animation styles
- Override global animation durations inconsistently
- Apply too many animations to a single element
- Use animations on performance-critical elements

## 🚀 **Performance Tips**

1. **Prefer transforms over layout changes**
2. **Use `will-change` sparingly** (handled automatically)
3. **Test animations on lower-end devices**
4. **Consider `prefers-reduced-motion` for accessibility**

## 📱 **Responsive Considerations**

Animations automatically adapt to screen sizes. For mobile-specific adjustments:

```tsx
<div className="animate-card-interactive md:animate-card-clickable">
  Different animations per breakpoint
</div>
```

## 🎪 **Demo Component**

Import and use the demo component to see all animations in action:

```tsx
import AnimationDemo from '@/components/common/animation-demo';

// In your page
<AnimationDemo />
```

This system ensures consistent, performant animations across your entire WasteLess application! 🌿✨