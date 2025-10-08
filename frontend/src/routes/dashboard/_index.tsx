import { useEffect, useState } from "react";
import DashboardLayout from "./layout";
import { userApi } from "../../lib/api";

export default function Dashboard() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user count when component mounts
    const fetchUserCount = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await userApi.getUserCount();
        setUserCount(data.userCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user count');
        console.error('Error fetching user count:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserCount();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Dashboard Home</h1>
        <p>Welcome to the dashboard!</p>

        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">User Statistics</h2>
          
          {loading && (
            <p className="text-gray-500">Loading user count...</p>
          )}
          
          {error && (
            <div className="text-red-600 bg-red-50 p-4 rounded">
              Error: {error}
            </div>
          )}
          
          {!loading && !error && userCount !== null && (
            <div className="text-4xl font-bold text-blue-600">
              {userCount} users
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}