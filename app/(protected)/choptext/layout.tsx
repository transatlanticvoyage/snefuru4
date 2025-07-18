'use client';

import ProtectedRoute from '@/app/components/ProtectedRoute';
import SharmiChopTextLayout from './components/SharmiChopTextLayout';

export default function SharmiChopTextLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SharmiChopTextLayout>
        {children}
      </SharmiChopTextLayout>
    </ProtectedRoute>
  );
}