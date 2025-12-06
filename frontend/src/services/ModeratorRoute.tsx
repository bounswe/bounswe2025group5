import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ACCESS_TOKEN_KEY, isModeratorUser } from '@/lib/api/client';

export default function ModeratorRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem(ACCESS_TOKEN_KEY);

  if (!isAuthed) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  if (!isModeratorUser()) {
    return <Navigate to="/mainpage" replace />;
  }

  return <>{children}</>;
}


