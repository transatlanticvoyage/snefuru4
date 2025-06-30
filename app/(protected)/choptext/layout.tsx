'use client';

import ProtectedRoute from '@/app/components/ProtectedRoute';
import ChopTextLayout from './components/ChopTextLayout';

export default function ChopTextLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <ChopTextLayout>
        {children}
      </ChopTextLayout>
    </ProtectedRoute>
  );
}