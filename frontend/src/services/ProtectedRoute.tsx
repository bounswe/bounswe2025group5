// ProtectedRoute.tsx
import type { JSX } from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const isAuthed = !!localStorage.getItem('authToken');
  return isAuthed ? children : <Navigate to="/auth/login" replace />;
}