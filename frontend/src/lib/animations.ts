/**
 * Global Animation System for WasteLess
 * Centralized animation configurations and utilities
 */

export const animationConfig = {
  // Duration presets (in milliseconds)
  durations: {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 750,
  },
  
  // Easing functions
  easings: {
    linear: 'linear',
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  
  // Scale presets
  scales: {
    none: '1',
    sm: '1.02',
    md: '1.05',
    lg: '1.1',
    xl: '1.15',
  },
} as const;

/**
 * Animation class name generators
 */
export const animations = {
  // Hover animations
  hover: {
    scale: (scale: keyof typeof animationConfig.scales = 'sm') => 
      `hover:scale-${scale === 'none' ? '100' : scale === 'sm' ? '102' : scale === 'md' ? '105' : scale === 'lg' ? '110' : '115'} transition-transform duration-300 ease-out`,
    lift: 'hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ease-out',
    glow: 'hover:shadow-xl hover:shadow-blue-500/25 transition-shadow duration-300 ease-out',
    brighten: 'hover:brightness-110 transition-all duration-300 ease-out',
  },
  
  // Click/Active animations
  active: {
    scale: 'active:scale-95 transition-transform duration-150 ease-out',
    push: 'active:translate-y-0.5 transition-transform duration-150 ease-out',
    dim: 'active:brightness-90 transition-all duration-150 ease-out',
  },
  
  // Focus animations
  focus: {
    ring: 'focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 transition-all duration-200 ease-out',
    glow: 'focus-visible:shadow-lg focus-visible:shadow-blue-500/25 transition-shadow duration-200 ease-out',
  },
  
  // Loading animations
  loading: {
    pulse: 'animate-pulse',
    spin: 'animate-spin',
    bounce: 'animate-bounce',
    ping: 'animate-ping',
  },
  
  // Entrance animations
  entrance: {
    fadeIn: 'animate-in fade-in duration-300',
    slideInUp: 'animate-in slide-in-from-bottom-4 duration-300 ease-out',
    slideInDown: 'animate-in slide-in-from-top-4 duration-300 ease-out',
    slideInLeft: 'animate-in slide-in-from-left-4 duration-300 ease-out',
    slideInRight: 'animate-in slide-in-from-right-4 duration-300 ease-out',
    scaleIn: 'animate-in zoom-in-95 duration-300 ease-out',
  },
  
  // Exit animations
  exit: {
    fadeOut: 'animate-out fade-out duration-200',
    slideOutUp: 'animate-out slide-out-to-top-4 duration-200 ease-in',
    slideOutDown: 'animate-out slide-out-to-bottom-4 duration-200 ease-in',
    slideOutLeft: 'animate-out slide-out-to-left-4 duration-200 ease-in',
    slideOutRight: 'animate-out slide-out-to-right-4 duration-200 ease-in',
    scaleOut: 'animate-out zoom-out-95 duration-200 ease-in',
  },
} as const;

/**
 * Common animation combinations for different UI elements
 */
export const presets = {
  // Button animations
  button: {
    primary: `${animations.hover.scale('md')} ${animations.active.scale} ${animations.focus.ring}`,
    secondary: `${animations.hover.scale('md')} ${animations.hover.lift} ${animations.active.scale} ${animations.active.push} ${animations.focus.ring}`,
    ghost: `${animations.hover.scale('md')} ${animations.hover.brighten} ${animations.active.scale} ${animations.active.dim} ${animations.focus.glow}`,
  },
  
  // Card animations
  card: {
    interactive: `${animations.hover.lift} ${animations.hover.glow} transition-all duration-300 ease-out`,
    static: `${animations.entrance.fadeIn}`,
    clickable: `${animations.hover.scale('sm')} ${animations.active.scale} cursor-pointer`,
  },
  
  // Input animations
  input: {
    default: `${animations.focus.ring} transition-all duration-200 ease-out`,
    error: 'focus-visible:ring-red-500/50 transition-all duration-200 ease-out',
    success: 'focus-visible:ring-green-500/50 transition-all duration-200 ease-out',
  },
  
  // List item animations
  listItem: {
    default: `${animations.hover.lift} ${animations.entrance.slideInUp}`,
    interactive: `${animations.hover.scale('sm')} ${animations.active.scale} cursor-pointer`,
  },
  
  // Modal/Dialog animations
  modal: {
    overlay: `${animations.entrance.fadeIn}`,
    content: `${animations.entrance.scaleIn}`,
  },
  
  // Navigation animations
  nav: {
    link: `${animations.hover.brighten} transition-all duration-200 ease-out`,
    tab: `${animations.hover.lift} ${animations.active.push} transition-all duration-200 ease-out`,
  },
} as const;

/**
 * Utility function to combine multiple animation classes
 */
export function combineAnimations(...animations: string[]): string {
  return animations.filter(Boolean).join(' ');
}

/**
 * Stagger animation delays for lists
 */
export function getStaggerDelay(index: number, baseDelay: number = 50): string {
  return `animation-delay-${Math.min(index * baseDelay, 500)}ms`;
}