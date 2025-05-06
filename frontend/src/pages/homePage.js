import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

export default function HomePage() {
  const navigate = useNavigate();
  const [userCount, setUserCount] = useState(-1);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("http://localhost:8080/api/users/count"); // adjust endpoint accordingly
        const data = await response.json();
        console.log("Fetched stats:", data);
        setUserCount(data.userCount); // assuming the response has a userCount field
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-6">
      <h1 className="text-4xl font-bold">Welcome to Our Waste Reduction Platform!</h1>
      <p className="text-lg text-center max-w-2xl">
        Join us in making the world a cleaner place. Track waste reductions, see community efforts, and be part of the change!
      </p>

      <div className="flex gap-4 mt-4">
        <Button onClick={() => navigate("/login")}>Login</Button>
        <Button onClick={() => navigate("/register")}>Register</Button>
        <Button onClick={() => navigate("/feed")}>Explore Feed</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 w-full max-w-4xl">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-semibold">Users</h2>
            <p className="text-4xl font-bold mt-2">{userCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-semibold">Waste Collected</h2>
            <p className="text-4xl font-bold mt-2">{userCount}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
