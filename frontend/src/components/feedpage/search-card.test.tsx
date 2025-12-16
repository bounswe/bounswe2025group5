import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, test, describe, vi } from 'vitest';
import SearchCard from '@/components/feedpage/search-card';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

describe('SearchCard', () => {
  test('renders search input and button', () => {
    const onSearch = vi.fn();
    const onClear = vi.fn();
    
    render(<SearchCard onSearch={onSearch} onClear={onClear} />);
    
    expect(screen.getByPlaceholderText('search.placeholder')).toBeInTheDocument();
    expect(screen.getByText('search.button')).toBeInTheDocument();
  });

  test('allows typing in search input', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onClear = vi.fn();
    
    render(<SearchCard onSearch={onSearch} onClear={onClear} />);
    
    const input = screen.getByPlaceholderText('search.placeholder');
    await user.type(input, 'recycling');
    
    expect(input).toHaveValue('recycling');
  });

  test('calls onSearch when form is submitted', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onClear = vi.fn();
    
    render(<SearchCard onSearch={onSearch} onClear={onClear} />);
    
    const input = screen.getByPlaceholderText('search.placeholder');
    await user.type(input, 'recycling');
    
    const searchButton = screen.getByText('search.button');
    await user.click(searchButton);
    
    expect(onSearch).toHaveBeenCalledWith('recycling');
  });

  test('calls onSearch when Enter key is pressed', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onClear = vi.fn();
    
    render(<SearchCard onSearch={onSearch} onClear={onClear} />);
    
    const input = screen.getByPlaceholderText('search.placeholder');
    await user.type(input, 'recycling{Enter}');
    
    expect(onSearch).toHaveBeenCalledWith('recycling');
  });

  test('does not call onSearch when query is empty', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onClear = vi.fn();
    
    render(<SearchCard onSearch={onSearch} onClear={onClear} />);
    
    const searchButton = screen.getByText('search.button');
    await user.click(searchButton);
    
    expect(onSearch).not.toHaveBeenCalled();
  });

  test('disables submit button when query is empty', () => {
    const onSearch = vi.fn();
    const onClear = vi.fn();
    
    render(<SearchCard onSearch={onSearch} onClear={onClear} />);
    
    const searchButton = screen.getByText('search.button');
    expect(searchButton).toBeDisabled();
  });

  test('enables submit button when query has content', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onClear = vi.fn();
    
    render(<SearchCard onSearch={onSearch} onClear={onClear} />);
    
    const input = screen.getByPlaceholderText('search.placeholder');
    await user.type(input, 'recycling');
    
    const searchButton = screen.getByText('search.button');
    expect(searchButton).toBeEnabled();
  });

  test('shows loading state when isLoading is true', () => {
    const onSearch = vi.fn();
    const onClear = vi.fn();
    
    render(<SearchCard onSearch={onSearch} onClear={onClear} isLoading={true} />);
    
    expect(screen.getByText('search.loading')).toBeInTheDocument();
  });

  test.skip('disables input and button when loading', () => {
    const onSearch = vi.fn();
    const onClear = vi.fn();
    
    render(<SearchCard onSearch={onSearch} onClear={onClear} isLoading={true} />);
    
    const input = screen.getByPlaceholderText('search.placeholder');
    const searchButton = screen.getByText('search.loading');
    
    expect(input).toBeDisabled();
    expect(searchButton).toBeDisabled();
  });

  test('shows clear button when search is active', () => {
    const onSearch = vi.fn();
    const onClear = vi.fn();
    
    render(<SearchCard onSearch={onSearch} onClear={onClear} isActive={true} />);
    
    expect(screen.getByText('search.clear')).toBeInTheDocument();
  });

  test('hides clear button when search is not active', () => {
    const onSearch = vi.fn();
    const onClear = vi.fn();
    
    render(<SearchCard onSearch={onSearch} onClear={onClear} isActive={false} />);
    
    expect(screen.queryByText('search.clear')).not.toBeInTheDocument();
  });

  test('calls onClear when clear button is clicked', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onClear = vi.fn();
    
    render(<SearchCard onSearch={onSearch} onClear={onClear} isActive={true} />);
    
    const clearButton = screen.getByText('search.clear');
    await user.click(clearButton);
    
    expect(onClear).toHaveBeenCalled();
  });

  test('clears input when clear button is clicked', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onClear = vi.fn();
    
    render(<SearchCard onSearch={onSearch} onClear={onClear} isActive={true} />);
    
    const input = screen.getByPlaceholderText('search.placeholder');
    await user.type(input, 'recycling');
    
    const clearButton = screen.getByText('search.clear');
    await user.click(clearButton);
    
    expect(input).toHaveValue('');
  });

  test('shows search results indicator when active', () => {
    const onSearch = vi.fn();
    const onClear = vi.fn();
    
    render(<SearchCard onSearch={onSearch} onClear={onClear} isActive={true} />);
    
    expect(screen.getByText('search.results')).toBeInTheDocument();
  });

  test.skip('hides search results indicator when not active', () => {
    const onSearch = vi.fn();
    const onClear = vi.fn();
    
    render(<SearchCard onSearch={onSearch} onClear={onClear} isActive={false} />);
    
    expect(screen.queryByText('search.results')).not.toBeInTheDocument();
  });

  test('trims whitespace from search query', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onClear = vi.fn();
    
    render(<SearchCard onSearch={onSearch} onClear={onClear} />);
    
    const input = screen.getByPlaceholderText('search.placeholder');
    await user.type(input, '  recycling  ');
    
    const searchButton = screen.getByText('search.button');
    await user.click(searchButton);
    
    expect(onSearch).toHaveBeenCalledWith('recycling');
  });

  test('does not submit with only whitespace', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onClear = vi.fn();
    
    render(<SearchCard onSearch={onSearch} onClear={onClear} />);
    
    const input = screen.getByPlaceholderText('search.placeholder');
    await user.type(input, '   ');
    
    const searchButton = screen.getByText('search.button');
    // Button should still be disabled
    expect(searchButton).toBeDisabled();
  });
});
