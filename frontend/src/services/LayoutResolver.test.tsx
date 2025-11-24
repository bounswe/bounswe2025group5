import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { LayoutResolver } from '@/services/LayoutResolver';

vi.mock('@/components/common/navbar', () => ({
  default: () => <div data-testid="navbar" />,
}));
vi.mock('@/components/common/LanguageToggle', () => ({
  default: () => <div data-testid="language-toggle" />,
}));
vi.mock('@/assets/background.png', () => ({
  default: 'mocked-bg.png',
}));
vi.mock('@/services/ProtectedRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="protected-wrapper">{children}</div>
  ),
}));

const originalDev = import.meta.env.DEV;

afterAll(() => {
  (import.meta.env as Record<string, unknown>).DEV = originalDev;
});

describe('LayoutResolver', () => {
  beforeEach(() => {
    (import.meta.env as Record<string, unknown>).DEV = true;
    localStorage.clear();
  });

  it('renders matched layout content for known routes', () => {
    render(
      <MemoryRouter initialEntries={['/mainpage']}>
        <LayoutResolver>
          <div data-testid="child-content">child</div>
        </LayoutResolver>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('wraps protected routes with ProtectedRoute outside dev mode', () => {
    (import.meta.env as Record<string, unknown>).DEV = false;

    render(
      <MemoryRouter initialEntries={['/goals']}>
        <LayoutResolver>
          <div data-testid="child-content">child</div>
        </LayoutResolver>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('protected-wrapper')).toBeInTheDocument();
  });

  it('does not guard unprotected auth routes even in production', () => {
    (import.meta.env as Record<string, unknown>).DEV = false;

    render(
      <MemoryRouter initialEntries={['/auth/login']}>
        <LayoutResolver>
          <div data-testid="child-content">child</div>
        </LayoutResolver>
      </MemoryRouter>,
    );

    expect(screen.queryByTestId('protected-wrapper')).not.toBeInTheDocument();
  });

  it('falls back to bare children when no layout matches the path', () => {
    render(
      <MemoryRouter initialEntries={['/unknown']}>
        <LayoutResolver>
          <div data-testid="child-content">child</div>
        </LayoutResolver>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
  });
});

