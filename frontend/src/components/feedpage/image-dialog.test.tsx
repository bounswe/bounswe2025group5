import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, test, describe, beforeEach, vi } from 'vitest';
import ImageDialog from './image-dialog';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'post.closeImage': 'Close image',
        'post.imageDialogTitle': `${options?.username}'s post image`,
        'post.imageDialogTitleGeneric': 'Post image',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>,
  XIcon: () => <div data-testid="x-icon">X</div>,
}));

describe('ImageDialog', () => {
  const mockOnOpenChange = vi.fn();
  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    imageUrl: 'https://example.com/image.jpg',
    altText: 'Test image',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dialog Rendering', () => {
    test('renders when open is true', () => {
      render(<ImageDialog {...defaultProps} />);
      
      expect(screen.getByRole('img', { name: /test image/i })).toBeInTheDocument();
    });

    test('does not render when open is false', () => {
      render(<ImageDialog {...defaultProps} open={false} />);
      
      expect(screen.queryByRole('img', { name: /test image/i })).not.toBeInTheDocument();
    });

    test('displays close button', () => {
      render(<ImageDialog {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /close image/i })).toBeInTheDocument();
    });
  });

  describe('Image Display', () => {
    test('displays image with correct src', () => {
      render(<ImageDialog {...defaultProps} />);
      
      const image = screen.getByRole('img', { name: /test image/i });
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    test('displays image with correct alt text', () => {
      render(<ImageDialog {...defaultProps} altText="Waste sorting guide" />);
      
      const image = screen.getByRole('img', { name: /waste sorting guide/i });
      expect(image).toBeInTheDocument();
    });

    test('applies correct styling classes to image', () => {
      render(<ImageDialog {...defaultProps} />);
      
      const image = screen.getByRole('img', { name: /test image/i });
      expect(image).toHaveClass('max-w-[85vw]', 'max-h-[75vh]', 'object-contain');
    });
  });

  describe('Dialog Title', () => {
    test('displays username in title when provided', () => {
      render(<ImageDialog {...defaultProps} username="testuser" />);
      
      expect(screen.getByText("testuser's post image")).toBeInTheDocument();
    });

    test('displays generic title when username is not provided', () => {
      render(<ImageDialog {...defaultProps} />);
      
      expect(screen.getByText('Post image')).toBeInTheDocument();
    });

    test('title is visually hidden but accessible', () => {
      render(<ImageDialog {...defaultProps} username="testuser" />);
      
      const title = screen.getByText("testuser's post image");
      expect(title).toHaveClass('sr-only');
    });
  });

  describe('Close Functionality', () => {
    test('calls onOpenChange with false when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<ImageDialog {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close image/i });
      await user.click(closeButton);
      
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    test('close button has correct aria-label', () => {
      render(<ImageDialog {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close image/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close image');
    });

    test('close button has correct styling', () => {
      render(<ImageDialog {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close image/i });
      expect(closeButton).toHaveClass('bg-black/50', 'hover:bg-destructive', 'text-white', 'rounded-full');
    });
  });

  describe('Dialog Backdrop', () => {
    test('dialog content has dark background', () => {
      render(<ImageDialog {...defaultProps} />);
      
      const container = screen.getByRole('img', { name: /test image/i }).parentElement;
      expect(container).toHaveClass('bg-[#1b1b1a]', 'backdrop-blur-md');
    });
  });

  describe('Edge Cases', () => {
    test('handles missing imageUrl', () => {
      render(<ImageDialog {...defaultProps} imageUrl="" />);
      
      const image = screen.getByRole('img', { name: /test image/i });
      // Empty src is typically not set as attribute or shows as empty
      expect(image.getAttribute('src')).toBeFalsy();
    });

    test('handles long alt text', () => {
      const longAltText = 'a'.repeat(200);
      render(<ImageDialog {...defaultProps} altText={longAltText} />);
      
      const image = screen.getByRole('img', { name: new RegExp(longAltText) });
      expect(image).toBeInTheDocument();
    });

    test('handles special characters in alt text', () => {
      render(<ImageDialog {...defaultProps} altText="<Test> & 'Quote'" />);
      
      const image = screen.getByRole('img', { name: /<Test> & 'Quote'/i });
      expect(image).toBeInTheDocument();
    });

    test('handles special characters in username', () => {
      render(<ImageDialog {...defaultProps} username="user<test>" />);
      
      expect(screen.getByText("user<test>'s post image")).toBeInTheDocument();
    });

    test('handles empty username string', () => {
      render(<ImageDialog {...defaultProps} username="" />);
      
      expect(screen.getByText('Post image')).toBeInTheDocument();
    });
  });

  describe('Dialog State Changes', () => {
    test('responds to open prop changes', () => {
      const { rerender } = render(<ImageDialog {...defaultProps} open={true} />);
      
      expect(screen.getByRole('img', { name: /test image/i })).toBeInTheDocument();
      
      rerender(<ImageDialog {...defaultProps} open={false} />);
      
      expect(screen.queryByRole('img', { name: /test image/i })).not.toBeInTheDocument();
    });

    test.skip('updates image when imageUrl changes', () => {
      const { rerender } = render(<ImageDialog {...defaultProps} />);
      
      let image = screen.getByRole('img', { name: /test image/i });
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
      
      rerender(
        <ImageDialog {...defaultProps} imageUrl="https://example.com/new-image.jpg" />
      );
      
      image = screen.getByRole('img', { name: /test image/i });
      expect(image).toHaveAttribute('src', 'https://example.com/new-image.jpg');
    });

    test('updates alt text when altText changes', () => {
      const { rerender } = render(<ImageDialog {...defaultProps} altText="First image" />);
      
      expect(screen.getByRole('img', { name: /first image/i })).toBeInTheDocument();
      
      rerender(<ImageDialog {...defaultProps} altText="Second image" />);
      
      expect(screen.getByRole('img', { name: /second image/i })).toBeInTheDocument();
      expect(screen.queryByRole('img', { name: /first image/i })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('image has accessible alt text', () => {
      render(<ImageDialog {...defaultProps} />);
      
      const image = screen.getByRole('img', { name: /test image/i });
      expect(image).toHaveAccessibleName('Test image');
    });

    test('close button has accessible label', () => {
      render(<ImageDialog {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close image/i });
      expect(closeButton).toHaveAccessibleName('Close image');
    });

    test('dialog title is present for screen readers', () => {
      render(<ImageDialog {...defaultProps} username="testuser" />);
      
      const title = screen.getByText("testuser's post image");
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('sr-only'); // Screen reader only
    });
  });

  describe('Multiple Dialog Instances', () => {
    test('handles multiple different images', () => {
      const { unmount: unmount1 } = render(
        <ImageDialog
          open={true}
          onOpenChange={vi.fn()}
          imageUrl="https://example.com/image1.jpg"
          altText="Image 1"
        />
      );
      
      expect(screen.getByRole('img', { name: /image 1/i })).toBeInTheDocument();
      
      unmount1();
      
      render(
        <ImageDialog
          open={true}
          onOpenChange={vi.fn()}
          imageUrl="https://example.com/image2.jpg"
          altText="Image 2"
        />
      );
      
      expect(screen.getByRole('img', { name: /image 2/i })).toBeInTheDocument();
    });
  });
});
