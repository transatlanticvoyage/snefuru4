'use client';

import AdminRoute from '@/app/components/AdminRoute';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRoute>
      {children}
    </AdminRoute>
  );
}