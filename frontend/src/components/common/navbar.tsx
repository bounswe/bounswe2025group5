import logo from '@/assets/logo2.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import LogoutButton from '@/components/common/LogoutButton';
import NotificationIcon from '@/components/common/NotificationIcon';
import { useTranslation } from 'react-i18next';
import { isModeratorUser } from '@/lib/api/client';

interface NavbarProps {
  className?: string;
}

//floating navbar with logo and title with rounded corners
export default function Navbar({ className }: NavbarProps) {
  
  const { t } = useTranslation();
  const navRoutes = [
  { name: t('profile.navbar'), path: '/profile' },
  { name: t('feed.navbar'), path: '/feed' },
  { name: t('goals.navbar'), path: '/goals' },
  { name: t('challenge.navbar'), path: '/challenges' },
];
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('authToken');
  const isModerator = isAuthed && isModeratorUser();
  if (isAuthed) {
    const index = navRoutes.findIndex(r => r.path === '/');
    if (index !== -1) {
      navRoutes[index].path = '/mainpage';
      navRoutes[index].name = t('mainpage.navbar');
    }
  }
  if (isModerator && !navRoutes.some(route => route.path === '/moderator')) {
    navRoutes.push({ name: t('moderator.navbar', 'Moderation'), path: '/moderator' });
  }
  const routesToShow = navRoutes.filter(r =>
    isAuthed || (r.path !== '/profile' && r.path !== '/goals' && r.path !== '/challenges')
  );

  return (
    <nav className={`bg-[#b07f5a]/90 backdrop-blur-sm text-white px-3 py-2 flex items-center gap-2 h-16 rounded-full shadow-lg border border-white/20 max-w-4xl mx-auto ${isAuthed ? (isModerator ? 'min-w-[660px]' : 'min-w-[60px]') : ''} ${className || ''}`}>
      {/* Logo and Title */}
      <div className="flex items-center shrink-0">
        <img
          src={logo}
          alt={t ? t('navbar.logoAlt', 'WasteLess application logo') : 'WasteLess application logo'}
          className="h-23 w-auto cursor-pointer transition-transform hover:scale-105 active:scale-95"
          onClick={() => navigate(isAuthed ? '/mainpage' : '/')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate(isAuthed ? '/mainpage' : '/');
            }
          }}
        />
      </div>

      {/* Navigation Links */}
      <div className="flex items-center gap-1 ml-auto">
        {routesToShow.map((route) => {
          const isActive = location.pathname === route.path;
          return (
            <Button
              key={route.path}
              variant="ghost"
              size="sm"
              onClick={() => navigate(route.path)}
              className={`text-white hover:bg-white/20 transition-colors ${
                isActive ? 'bg-white/20 font-semibold' : ''
              }`}
            >
              {route.name}
            </Button>
          );
        })}
        {!isAuthed && location.pathname !== '/auth/register' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/auth/register')}
            className="text-white hover:bg-white/20 transition-colors"
          >
            {t('login.signup')}
          </Button>
        )}
        {!isAuthed && location.pathname === '/auth/register' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/auth/login')}
            className="text-white hover:bg-white/20 transition-colors"
          >
            {t('login.login')}
          </Button>
        )}
        <div className="flex items-center gap-1 shrink-0">
          <LogoutButton />
          {isAuthed && <NotificationIcon />}
        </div>
      </div>
    </nav>
  );
}