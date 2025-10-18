// ProtectedRoute.tsx
import type { ReactElement, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: ReactNode }): ReactElement {
  const isAuthed = !!localStorage.getItem('authToken');
  return isAuthed ? <>{children}</> : <Navigate to="/auth/login" replace />;
}