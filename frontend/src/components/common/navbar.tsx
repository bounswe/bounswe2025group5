import logo from '@/assets/logo2.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { clearTokens } from '@/lib/api/client';

interface NavbarProps {
  className?: string;
}

const navRoutes = [
  { name: 'Main', path: '/' },
  { name: 'Profile', path: '/profile' },
  { name: 'Feed', path: '/feed' },
  { name: 'Goals', path: '/goals' },
  { name: 'Challenge', path: '/challenges' },
];

//floating navbar with logo and title with rounded corners
export default function Navbar({ className }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('authToken');

  const handleLogout = () => {
    clearTokens();
    localStorage.removeItem('username');
    navigate('/auth/login', { replace: true });
  };

  return (
    <nav className={`bg-[#b07f5a]/90 backdrop-blur-sm text-white px-3 py-2 flex items-center gap-2 h-16 rounded-full shadow-lg border border-white/20 max-w-4xl mx-auto ${className || ''}`}>
      {/* Logo and Title */}
      <div className="flex items-center shrink-0">
        <img src={logo} alt="Wasteless Logo" className="h-23 w-auto" />
      </div>

      {/* Navigation Links */}
      <div className="flex items-center gap-1 ml-auto">
        {navRoutes.map((route) => {
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
        {isAuthed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-white hover:bg-white/20 transition-colors"
          >
            Logout
          </Button>
        )}
      </div>
    </nav>
  );
}