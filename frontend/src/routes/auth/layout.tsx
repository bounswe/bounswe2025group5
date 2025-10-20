import wallpaper from '@/assets/background.png';
import LanguageToggle from '@/components/common/LanguageToggle';
import Navbar from '@/components/common/navbar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
      <div 
        className="min-h-screen relative bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: `url(${wallpaper})` }}
      >
        {/* Fixed Floating Navbar */}
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
          <Navbar />
        </div>
        <div className="fixed bottom-6 left-6 z-50">
          <LanguageToggle />
        </div>
        <main
          className="min-h-screen flex items-center justify-center p-4"
        >
          {children}
        </main>
      </div>
    );
  }
