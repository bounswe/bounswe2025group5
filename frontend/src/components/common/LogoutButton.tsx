import { Button } from '@/components/ui/button';
import { clearTokens } from '@/lib/api/client';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className }: LogoutButtonProps) {
  const navigate = useNavigate();
  const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('authToken');
  const { t } = useTranslation();

  const handleLogout = () => {
    clearTokens();
    localStorage.removeItem('username');
    navigate('/auth/login', { replace: true });
  };

  if (!isAuthed) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className={className ?? 'text-white hover:bg-white/20 transition-colors'}
    >
      {t('logout', 'Logout')}
    </Button>
  );
}


