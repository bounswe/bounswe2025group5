import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { clearTokens } from '@/lib/api/client';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className }: LogoutButtonProps) {
  const navigate = useNavigate();
  const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('authToken');
  const { t } = useTranslation();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    clearTokens();
    localStorage.removeItem('username');
    navigate('/auth/login', { replace: true });
  };

  if (!isAuthed) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowLogoutDialog(true)}
        className={className ?? 'text-white hover:bg-destructive hover:text-destructive-foreground transition-colors'}
      >
        {t('logout.label', 'Logout')}
      </Button>

      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('logout.dialog.title', 'Confirm Logout')}</DialogTitle>
            <DialogDescription>
              {t('logout.dialog.description', 'Are you sure you want to logout? You will need to sign in again to access your account.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
            >
              {t('logout.dialog.cancel', 'Cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowLogoutDialog(false);
                handleLogout();
              }}
            >
              {t('logout.dialog.confirm', 'Logout')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


