import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import Index from '@/routes/_index';
import * as React from 'react';
import * as ReactRouterDom from 'react-router-dom';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof ReactRouterDom>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const { MemoryRouter } = ReactRouterDom;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/components/ui/glass-card', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="glass-card">{children}</div>,
}));

const carouselApi = {
  canScrollNext: vi.fn().mockReturnValue(false),
  scrollNext: vi.fn(),
  scrollTo: vi.fn(),
};

vi.mock('@/components/ui/carousel', () => {
  const passThrough = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  const Carousel = ({ children, setApi }: { children: React.ReactNode; setApi?: (api: typeof carouselApi) => void }) => {
    React.useEffect(() => {
      setApi?.(carouselApi);
    }, [setApi]);
    return <div data-testid="carousel">{children}</div>;
  };
  return {
    Carousel,
    CarouselContent: passThrough,
    CarouselItem: passThrough,
    CarouselPrevious: () => <button aria-label="previous" />,
    CarouselNext: () => <button aria-label="next" />,
  };
});

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

const originalLocalStorage = window.localStorage;

beforeAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    configurable: true,
    writable: true,
  });
});

afterAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: originalLocalStorage,
    configurable: true,
    writable: true,
  });
});

describe('Landing Index Route', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    localStorageMock.clear();
  });

  it('redirects authenticated users to the main page', async () => {
    localStorage.setItem('authToken', 'token');

    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>,
    );

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/mainpage'));
  });

  it('navigates to login when login button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>,
    );

    const loginButton = await screen.findByRole('button', { name: 'login.login' });
    await user.click(loginButton);

    expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
  });
});

