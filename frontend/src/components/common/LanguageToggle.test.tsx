import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import LanguageToggle from './LanguageToggle';
import i18n from '@/services/useClientTranslation';

// Mock i18n
vi.mock('@/services/useClientTranslation', () => ({
  default: {
    language: 'tr',
    changeLanguage: vi.fn(),
  },
}));

// Mock flag images
vi.mock('@/assets/turkey.png', () => ({
  default: 'mocked-turkey-flag.png',
}));

vi.mock('@/assets/united-kingdom.png', () => ({
  default: 'mocked-uk-flag.png',
}));

describe('LanguageToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    i18n.language = 'tr';
  });

  test('renders with correct flag for Turkish language', () => {
    i18n.language = 'tr';
    
    render(<LanguageToggle />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByAltText('UK flag')).toBeInTheDocument();
  });

  test('renders with correct flag for English language', () => {
    i18n.language = 'en';
    
    render(<LanguageToggle />);
    
    expect(screen.getByAltText('Türk bayrağı')).toBeInTheDocument();
  });

  test('toggles language from Turkish to English', async () => {
    const user = userEvent.setup();
    i18n.language = 'tr';
    
    render(<LanguageToggle />);
    
    await user.click(screen.getByRole('button'));
    
    expect(i18n.changeLanguage).toHaveBeenCalledWith('en');
    expect(screen.getByAltText('Türk bayrağı')).toBeInTheDocument();
  });

  test('toggles language from English to Turkish', async () => {
    const user = userEvent.setup();
    i18n.language = 'en';
    
    render(<LanguageToggle />);
    
    await user.click(screen.getByRole('button'));
    
    expect(i18n.changeLanguage).toHaveBeenCalledWith('tr');
    expect(screen.getByAltText('UK flag')).toBeInTheDocument();
  });
});
