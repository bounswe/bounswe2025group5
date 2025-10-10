import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen relative">
      <img src="/images/wallpaper.png" alt="Background" className="pointer-events-none select-none fixed inset-0 z-0 w-screen h-screen object-cover" />
      <div className="fixed inset-0 z-0 bg-black/55 backdrop-blur-[2px]" />
      <div className="relative z-10 text-white">
        <Outlet />
      </div>
    </div>
  );
}
