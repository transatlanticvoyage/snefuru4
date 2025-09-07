'use client';

import ProtectedRoute from '../components/ProtectedRoute';
import { LayoutSystemProvider } from '../components/layout-systems';
import SelectedRowStyles from '../components/SelectedRowStyles';
import '../styles/shenfur_th_cells_db_table_row.css';
import '../styles/firestorm_fk_data_badge.css';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <LayoutSystemProvider>
        {children}
      </LayoutSystemProvider>
      <SelectedRowStyles />
    </ProtectedRoute>
  );
} 