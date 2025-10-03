// src/root.tsx
import { Outlet } from "react-router-dom";
import "./index.css"; // your Tailwind/global CSS

export default function Root() {
  return (
    <div className="min-h-dvh">
      {/* put persistent UI here (Navbar, Toaster, etc.) */}
      <Outlet />
    </div>
  );
}
