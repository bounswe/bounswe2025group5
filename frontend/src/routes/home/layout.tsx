import Navbar from '@/components/common/navbar';
import wallpaper from '@/assets/background.png';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative">
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
        <Navbar />
      </div>
      <main className="min-h-screen pt-24"
        style={{ backgroundImage: `url(${wallpaper})` }}
        >
        {children}
      </main>
    </div>
  );
}


