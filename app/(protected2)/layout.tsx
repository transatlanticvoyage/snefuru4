'use client';

import ProtectedRoute from '../components/ProtectedRoute';

export default function Protected2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}