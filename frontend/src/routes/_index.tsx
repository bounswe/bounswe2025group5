import { Link } from "react-router-dom";

// src/routes/_index.tsx
export default function Index() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Welcome to the Home Page!</h1>
      <p className="mt-4 text-lg">This is your index route rendering successfully.</p>
      <Link to="/dashboard" className="text-blue-500">Dashboard</Link>
    </div>
  );
}
