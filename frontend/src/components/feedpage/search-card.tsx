import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SearchCardProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  isLoading?: boolean;
  isActive?: boolean;
  externalQuery?: string;
}

export default function SearchCard({ onSearch, onClear, isLoading = false, isActive = false, externalQuery }: SearchCardProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const debounceTimerRef = useRef<number | null>(null);
  const lastSearchedQueryRef = useRef<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Update internal query when external query is provided
  useEffect(() => {
    if (externalQuery && externalQuery !== query) {
      setQuery(externalQuery);
      lastSearchedQueryRef.current = externalQuery;
    }
  }, [externalQuery]);

  // Auto-trigger search after 1 second of inactivity
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If query is empty, call onClear only if we had a previous search
    if (query.trim() === '' && lastSearchedQueryRef.current !== '') {
      // Call onClear when query becomes empty after a search
      lastSearchedQueryRef.current = '';
      onClear();
      return;
    }

    // If query has content and is different from last search, set timer
    if (query.trim() && query.trim() !== lastSearchedQueryRef.current) {
      debounceTimerRef.current = setTimeout(() => {
        lastSearchedQueryRef.current = query.trim();
        onSearch(query.trim());
        // Keep focus on input after search
        inputRef.current?.focus();
      }, 600);
    }

    // Cleanup timer on unmount or query change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, onSearch, onClear]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && query.trim() !== lastSearchedQueryRef.current) {
      // Cancel debounce timer and search immediately
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      lastSearchedQueryRef.current = query.trim();
      onSearch(query.trim());
      // Keep focus on input after search
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    setQuery('');
    lastSearchedQueryRef.current = '';
    onClear();
  };

  return (
    <Card>
      <CardContent className="transition-all duration-300 ease-in-out">
        <form onSubmit={handleSubmit} className="space-y-4" aria-label={t('search.formLabel', 'Search posts')}>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" aria-hidden="true" />
              <Input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="pl-10 animate-input focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary/20"
                aria-label={t('search.placeholder')}
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              disabled={!query.trim() || isLoading}
              className="min-w-[80px]"
            >
              {isLoading ? t('search.loading') : t('search.button')}
            </Button>
            {isActive && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleClear}
                className="min-w-[80px]"
              >
                <X className="h-4 w-4" />
                {t('search.clear')}
              </Button>
            )}
          </div>
        </form>
        
        <div 
          className={`overflow-visible transition-all duration-300 ease-in-out ${
            isActive ? 'max-h-20 opacity-100 mt-3 pt-1' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex items-center justify-center">
            <p className="text-sm text-secondary font-medium mt-0.5">
              {t('search.results')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}