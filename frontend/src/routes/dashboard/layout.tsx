import { useEffect } from "react";
import { getAccessToken } from "../../lib/api/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      window.location.href = "/login";
    }
  }, []);
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
      <nav className="mb-4">
        <a href="/dashboard" className="mr-4 text-blue-600 hover:underline">Home</a>
        <a href="/dashboard/settings" className="text-blue-600 hover:underline">Settings</a>
      </nav>
      {children}
    </div>
  );
}
