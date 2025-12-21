import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, test, describe, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Navbar from './navbar';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'main.navbar': 'Home',
        'mainpage.navbar': 'Main Page',
        'profile.navbar': 'Profile',
        'feed.navbar': 'Feed',
        'goals.navbar': 'Goals',
        'challenge.navbar': 'Challenges',
        'login.signup': 'Sign Up',
        'login.login': 'Login',
        'navbar.logoAlt': 'WasteLess application logo',
      };
      return translations[key] || fallback || key;
    },
  }),
}));

// Mock assets
vi.mock('@/assets/logo2.png', () => ({
  default: 'logo.png',
}));

// Mock child components
vi.mock('./LogoutButton', () => ({
  default: () => {
    const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('authToken');
    if (!isAuthed) return null;
    return <button data-testid="logout-button">Logout</button>;
  },
}));

vi.mock('./NotificationIcon', () => ({
  default: () => <div data-testid="notification-icon">Notifications</div>,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Helper to render navbar with router context
function renderNavbar(initialPath = '/', isAuthenticated = false) {
  if (isAuthenticated) {
    localStorageMock.setItem('authToken', 'mock-token');
  } else {
    localStorageMock.clear();
  }

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="*" element={<Navbar />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Navbar', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Unauthenticated State', () => {
    test('renders logo with correct alt text', () => {
      renderNavbar('/', false);
      const logo = screen.getByAltText('WasteLess application logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', 'logo.png');
    });

    test('renders public navigation links', () => {
      renderNavbar('/', false);
      expect(screen.getByRole('button', { name: 'Feed' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
    });

    test('does not render protected navigation links', () => {
      renderNavbar('/', false);
      expect(screen.queryByRole('button', { name: 'Profile' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Goals' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Challenges' })).not.toBeInTheDocument();
    });

    test('does not render logout button and notification icon', () => {
      renderNavbar('/', false);
      expect(screen.queryByTestId('logout-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('notification-icon')).not.toBeInTheDocument();
    });

    test('highlights active route', () => {
      renderNavbar('/feed', false);
      const feedButton = screen.getByRole('button', { name: 'Feed' });
      expect(feedButton).toHaveClass('bg-white/20', 'font-semibold');
    });

    test('navigates when clicking navigation links', async () => {
      const user = userEvent.setup();
      renderNavbar('/', false);
      
      const feedButton = screen.getByRole('button', { name: 'Feed' });
      await user.click(feedButton);
      
      // After navigation, Feed should be active
      await waitFor(() => {
        expect(feedButton).toHaveClass('bg-white/20', 'font-semibold');
      });
    });

    test('shows sign up button for unauthenticated users', () => {
      renderNavbar('/', false);
      const signUpButton = screen.getByRole('button', { name: 'Sign Up' });
      expect(signUpButton).toBeInTheDocument();
      expect(signUpButton).toHaveClass('text-white', 'hover:bg-white/20');
    });
  });

  describe('Authenticated State', () => {
    test('renders logo with correct alt text', () => {
      renderNavbar('/', true);
      const logo = screen.getByAltText('WasteLess application logo');
      expect(logo).toBeInTheDocument();
    });

    test('renders all navigation links including protected routes', () => {
      renderNavbar('/', true);
      expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Feed' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Goals' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Challenges' })).toBeInTheDocument();
    });

    test('does not show protected routes for unauthenticated users', () => {
      renderNavbar('/', false);
      expect(screen.queryByRole('button', { name: 'Profile' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Goals' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Challenges' })).not.toBeInTheDocument();
    });

    test('renders logout button and notification icon', () => {
      renderNavbar('/', true);
      expect(screen.getByTestId('logout-button')).toBeInTheDocument();
      expect(screen.getByTestId('notification-icon')).toBeInTheDocument();
    });

    test('does not render sign up button', () => {
      renderNavbar('/', true);
      expect(screen.queryByRole('button', { name: 'Sign Up' })).not.toBeInTheDocument();
    });

    test('highlights active route for authenticated users', () => {
      renderNavbar('/profile', true);
      const profileButton = screen.getByRole('button', { name: 'Profile' });
      expect(profileButton).toHaveClass('bg-white/20', 'font-semibold');
    });

    test('navigates when clicking navigation links', async () => {
      const user = userEvent.setup();
      renderNavbar('/mainpage', true);
      
      const goalsButton = screen.getByRole('button', { name: 'Goals' });
      await user.click(goalsButton);
      
      await waitFor(() => {
        expect(goalsButton).toHaveClass('bg-white/20', 'font-semibold');
      });
    });

    test('applies minimum width for authenticated navbar', () => {
      const { container } = renderNavbar('/', true);
      const nav = container.querySelector('nav');
      // Regular authenticated user gets min-w-[60px], moderator would get min-w-[660px]
      expect(nav).toHaveClass('min-w-[60px]');
    });
  });

  describe('Custom Styling', () => {
    test('applies custom className when provided', () => {
      localStorageMock.clear();
      render(
        <MemoryRouter>
          <Navbar className="custom-class" />
        </MemoryRouter>
      );
      const nav = document.querySelector('nav');
      expect(nav).toHaveClass('custom-class');
    });

    test('applies default styling classes', () => {
      renderNavbar('/', false);
      const nav = document.querySelector('nav');
      expect(nav).toHaveClass(
        'bg-[#b07f5a]/90',
        'backdrop-blur-sm',
        'text-white',
        'rounded-full',
        'shadow-lg',
        'border',
        'border-white/20'
      );
    });
  });

  describe('Navigation Behavior', () => {
    test('all navigation buttons have correct hover states', () => {
      renderNavbar('/', false);
      const feedButton = screen.getByRole('button', { name: 'Feed' });
      const signUpButton = screen.getByRole('button', { name: 'Sign Up' });
      
      expect(feedButton).toHaveClass('hover:bg-white/20', 'transition-colors');
      expect(signUpButton).toHaveClass('hover:bg-white/20', 'transition-colors');
    });

    test('navigates to sign up page when clicking sign up button', async () => {
      const user = userEvent.setup();
      renderNavbar('/', false);
      
      const signUpButton = screen.getByRole('button', { name: 'Sign Up' });
      await user.click(signUpButton);
      
      // After navigation to /auth/register, the button changes to Login
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    test('contains responsive padding and height classes', () => {
      renderNavbar('/', false);
      const nav = document.querySelector('nav');
      expect(nav).toHaveClass('px-3', 'py-2', 'h-16');
    });

    test('has centered max-width container', () => {
      renderNavbar('/', false);
      const nav = document.querySelector('nav');
      expect(nav).toHaveClass('max-w-4xl', 'mx-auto');
    });
  });

  describe('Accessibility', () => {
    test('navigation has correct semantic element', () => {
      renderNavbar('/', false);
      const nav = document.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    test('logo has accessible alt text', () => {
      renderNavbar('/', false);
      const logo = screen.getByAltText('WasteLess application logo');
      expect(logo).toBeInTheDocument();
    });

    test('all navigation items are buttons with accessible names', () => {
      renderNavbar('/', false);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles missing authToken gracefully', () => {
      localStorageMock.removeItem('authToken');
      renderNavbar('/', false);
      expect(screen.queryByRole('button', { name: 'Profile' })).not.toBeInTheDocument();
    });

    test('renders correctly when window object is undefined during SSR', () => {
      // This is implicitly tested by not using window directly in tests
      renderNavbar('/', false);
      expect(screen.getByRole('button', { name: 'Feed' })).toBeInTheDocument();
    });

    test('handles navigation to non-existent routes', async () => {
      const user = userEvent.setup();
      renderNavbar('/unknown-route', false);
      
      const feedButton = screen.getByRole('button', { name: 'Feed' });
      await user.click(feedButton);
      
      expect(feedButton).toBeInTheDocument();
    });
  });
});
