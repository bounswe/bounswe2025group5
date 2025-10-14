import logo from '@/assets/logo2.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import LogoutButton from '@/components/common/LogoutButton';
import { useTranslation } from 'react-i18next';

interface NavbarProps {
  className?: string;
}

//floating navbar with logo and title with rounded corners
export default function Navbar({ className }: NavbarProps) {
  
  const { t } = useTranslation();
  const navRoutes = [
  { name: t('main.navbar'), path: '/' },
  { name: t('profile.navbar'), path: '/profile' },
  { name: t('feed.navbar'), path: '/feed' },
  { name: t('goals.navbar'), path: '/goals' },
  { name: t('challenge.navbar'), path: '/challenges' },
];
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('authToken');
  if (isAuthed) {
    const index = navRoutes.findIndex(r => r.path === '/');
    if (index !== -1) {
      navRoutes[index].path = '/mainpage';
      navRoutes[index].name = t('mainpage.navbar');
    }
  }
  const routesToShow = navRoutes.filter(r =>
    isAuthed || (r.path !== '/profile' && r.path !== '/goals' && r.path !== '/challenges')
  );

  return (
    <nav className={`bg-[#b07f5a]/90 backdrop-blur-sm text-white px-3 py-2 flex items-center gap-2 h-16 rounded-full shadow-lg border border-white/20 max-w-4xl mx-auto ${className || ''}`}>
      {/* Logo and Title */}
      <div className="flex items-center shrink-0">
        <img src={logo} alt="Wasteless Logo" className="h-23 w-auto" />
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
        {!isAuthed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/auth/login')}
            className="text-white hover:bg-white/20 transition-colors"
          >
            {t('login.signup')}
          </Button>
        )}
        <LogoutButton />
      </div>
    </nav>
  );
}