import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './mocks/server';
import React from 'react';

// Mock react-masonry-css
vi.mock('react-masonry-css', () => ({
  default: ({ children, className }: { children: React.ReactNode; className?: string }) => {
    return React.createElement('div', { className }, children);
  },
}));

// Mock asset imports
vi.mock('@/assets/user.png', () => ({
  default: 'mocked-user-avatar.png',
}));

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

