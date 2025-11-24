import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import Index from '@/routes/_index';
import * as ReactRouterDom from 'react-router-dom';

const { MemoryRouter } = ReactRouterDom;
const mockNavigate = vi.fn();
vi.spyOn(ReactRouterDom, 'useNavigate').mockImplementation(() => mockNavigate);

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
  const React = require('react');
  const useEffect = React.useEffect;
  const passThrough = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  const Carousel = ({ children, setApi }: { children: React.ReactNode; setApi?: (api: typeof carouselApi) => void }) => {
    useEffect(() => {
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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
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

