import { useMemo } from 'react';
import progressCleanImage from '@/assets/progress_clean_1.png';
import progressDirtyImage from '@/assets/progress_dirty_1.png';
import recycleGif from '@/assets/recycle.gif';

interface RecyclingProgressVisualizationProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Width of the visualization container */
  width?: number;
  /** Height of the visualization container */
  height?: number;
  /** Additional CSS classes */
  className?: string;
}

export default function RecyclingProgressVisualization({
  progress,
  width = 400,
  height = 200,
  className = ''
}: RecyclingProgressVisualizationProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = useMemo(() => Math.max(0, Math.min(100, progress)), [progress]);

  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{ width, height }}
      role="group"
      aria-label={`Recycling progress ${clampedProgress.toFixed(0)} percent`}
    >
      {/* Background dirty image */}
      <img
        src={progressDirtyImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Clean image with progressive reveal */}
      <img
        src={progressCleanImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ 
          clipPath: `inset(0 ${100 - clampedProgress}% 0 0)`
        }}
      />
      
      {/* Progress line indicator */}
      {clampedProgress > 0 && clampedProgress < 100 && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-lg"
          style={{ left: `${clampedProgress}%` }}
          aria-hidden="true"
        >
          {/* Animated recycling icon */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full shadow-lg flex items-center justify-center">
            <img 
              src={recycleGif}
              alt=""
              aria-hidden="true"
              className="w-8 h-8 object-contain"
            />
          </div>
        </div>
      )}
      
      {/* Progress percentage overlay */}
      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
        {clampedProgress.toFixed(0)}%
      </div>
    </div>
  );
}