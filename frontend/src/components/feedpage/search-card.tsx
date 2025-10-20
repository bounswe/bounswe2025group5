import { useState } from 'react';
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
}

export default function SearchCard({ onSearch, onClear, isLoading = false, isActive = false }: SearchCardProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="pl-10 animate-input"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="min-w-[80px]"
            >
              {isLoading ? t('search.loading') : t('search.button')}
            </Button>
            {isActive && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                {t('search.clear')}
              </Button>
            )}
          </div>
        </form>
        
        {isActive && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm text-emerald-700 font-medium">
              {t('search.results')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}