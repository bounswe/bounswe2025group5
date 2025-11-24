import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import RecyclingProgressVisualization from './RecyclingProgressVisualization';

// Mock image imports
vi.mock('@/assets/progress_clean_1.png', () => ({
  default: 'mocked-clean-image.png',
}));

vi.mock('@/assets/progress_dirty_1.png', () => ({
  default: 'mocked-dirty-image.png',
}));

vi.mock('@/assets/recycle.gif', () => ({
  default: 'mocked-recycle.gif',
}));

describe('RecyclingProgressVisualization', () => {
  describe('Rendering', () => {
    test('renders with default props', () => {
      render(<RecyclingProgressVisualization progress={50} />);
      
      expect(screen.getByRole('group')).toBeInTheDocument();
      expect(screen.getByLabelText(/recycling progress 50 percent/i)).toBeInTheDocument();
    });

    test('renders with custom width and height', () => {
      render(<RecyclingProgressVisualization progress={50} width={600} height={300} />);
      
      const container = screen.getByRole('group');
      expect(container).toHaveStyle({ width: '600px', height: '300px' });
    });

    test('renders with custom className', () => {
      render(<RecyclingProgressVisualization progress={50} className="custom-class" />);
      
      const container = screen.getByRole('group');
      expect(container).toHaveClass('custom-class');
    });

    test('renders all images', () => {
      const { container } = render(<RecyclingProgressVisualization progress={50} />);
      
      const images = container.querySelectorAll('img');
      expect(images).toHaveLength(3); // dirty, clean, recycle gif
    });
  });

  describe('Progress Clamping', () => {
    test('clamps negative progress to 0', () => {
      render(<RecyclingProgressVisualization progress={-10} />);
      
      expect(screen.getByLabelText(/recycling progress 0 percent/i)).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    test('clamps progress over 100 to 100', () => {
      render(<RecyclingProgressVisualization progress={150} />);
      
      expect(screen.getByLabelText(/recycling progress 100 percent/i)).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    test('handles valid progress values', () => {
      render(<RecyclingProgressVisualization progress={75} />);
      
      expect(screen.getByLabelText(/recycling progress 75 percent/i)).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  describe('Progress Indicator', () => {
    test('shows progress indicator for mid-range values', () => {
      const { container } = render(<RecyclingProgressVisualization progress={50} />);
      
      const indicator = container.querySelector('[style*="left: 50%"]');
      expect(indicator).toBeInTheDocument();
    });

    test('hides progress indicator at 0%', () => {
      const { container } = render(<RecyclingProgressVisualization progress={0} />);
      
      const indicator = container.querySelector('[style*="left: 0%"]');
      expect(indicator).not.toBeInTheDocument();
    });

    test('hides progress indicator at 100%', () => {
      const { container } = render(<RecyclingProgressVisualization progress={100} />);
      
      const indicator = container.querySelector('[style*="left: 100%"]');
      expect(indicator).not.toBeInTheDocument();
    });

    test('shows indicator at 1%', () => {
      const { container } = render(<RecyclingProgressVisualization progress={1} />);
      
      const indicator = container.querySelector('[style*="left: 1%"]');
      expect(indicator).toBeInTheDocument();
    });

    test('shows indicator at 99%', () => {
      const { container } = render(<RecyclingProgressVisualization progress={99} />);
      
      const indicator = container.querySelector('[style*="left: 99%"]');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Progress Display', () => {
    test('displays correct percentage text', () => {
      render(<RecyclingProgressVisualization progress={42} />);
      
      expect(screen.getByText('42%')).toBeInTheDocument();
    });

    test('applies correct clipPath style to clean image', () => {
      const { container } = render(<RecyclingProgressVisualization progress={60} />);
      
      const cleanImage = container.querySelector('[style*="clip-path"]');
      expect(cleanImage).toHaveStyle({ clipPath: 'inset(0 40% 0 0)' });
    });

    test('rounds decimal progress values', () => {
      render(<RecyclingProgressVisualization progress={42.7} />);
      
      expect(screen.getByText('43%')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has correct ARIA role', () => {
      render(<RecyclingProgressVisualization progress={50} />);
      
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    test('has ARIA label with progress value', () => {
      render(<RecyclingProgressVisualization progress={65} />);
      
      expect(screen.getByLabelText('Recycling progress 65 percent')).toBeInTheDocument();
    });

    test('images have aria-hidden attribute', () => {
      const { container } = render(<RecyclingProgressVisualization progress={50} />);
      
      const images = container.querySelectorAll('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles 0% progress', () => {
      render(<RecyclingProgressVisualization progress={0} />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByLabelText('Recycling progress 0 percent')).toBeInTheDocument();
    });

    test('handles 100% progress', () => {
      render(<RecyclingProgressVisualization progress={100} />);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByLabelText('Recycling progress 100 percent')).toBeInTheDocument();
    });

    test('handles very large numbers', () => {
      render(<RecyclingProgressVisualization progress={999999} />);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    test('handles decimal progress values', () => {
      render(<RecyclingProgressVisualization progress={33.33} />);
      
      expect(screen.getByText('33%')).toBeInTheDocument();
    });
  });
});
