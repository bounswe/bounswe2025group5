import wallpaper from '@/assets/background.png';
import LanguageToggle from '@/components/common/LanguageToggle';
import Navbar from '@/components/common/navbar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
      <div className="min-h-screen relative">
        {/* Fixed Floating Navbar */}
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
          <Navbar />
        </div>
        <div className="fixed bottom-6 left-6 z-50">
          <LanguageToggle />
        </div>
        <main
          className="min-h-screen w-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${wallpaper})` }}
        >
          {children}
        </main>
      </div>
    );
  }