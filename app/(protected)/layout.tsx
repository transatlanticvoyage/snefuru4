'use client';

import { useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import Header from '../components/Header';
import SidebarMenu from '../components/SidebarMenu';
import SelectedRowStyles from '../components/SelectedRowStyles';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex">
        <SidebarMenu isOpen={sidebarOpen} onToggle={toggleSidebar} />
        <div className="flex-1 flex flex-col">
          <Header onSidebarToggle={toggleSidebar} />
          <main className="py-6 px-4">
            {children}
          </main>
        </div>
        <SelectedRowStyles />
      </div>
    </ProtectedRoute>
  );
} 