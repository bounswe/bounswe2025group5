
import wallpaper from '@/assets/background.png';
import Navbar from '@/components/common/navbar';

export default function mainLayout({ children }: { children: React.ReactNode }) {
    return (
      <div 
        className="min-h-screen relative bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: `url(${wallpaper})` }}
      >
        {/* Fixed Floating Navbar */}
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
          <Navbar />
        </div>
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    );
  }