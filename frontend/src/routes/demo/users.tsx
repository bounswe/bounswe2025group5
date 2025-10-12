import { useEffect, useState } from "react";
import { UsersApi } from "@/lib/api/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DemoUsers() {
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await UsersApi.getUserCount();
        setCount(res.userCount);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Count</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-white/80">Loading...</p>}
        {error && <p className="text-red-400">{error}</p>}
        {!loading && !error && <p className="text-white text-2xl font-semibold">{count}</p>}
      </CardContent>
    </Card>
  );
}


