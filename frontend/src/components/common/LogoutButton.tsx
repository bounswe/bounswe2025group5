import { Button } from '@/components/ui/button';
import { clearTokens } from '@/lib/api/client';
import { useNavigate } from 'react-router-dom';

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className }: LogoutButtonProps) {
  const navigate = useNavigate();
  const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('authToken');

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
      Logout
    </Button>
  );
}


