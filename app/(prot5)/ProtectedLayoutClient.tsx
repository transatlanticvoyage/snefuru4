'use client';

import { useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import Header from '../components/Header';
import SidebarMenu from '../components/SidebarMenu';
import SelectedRowStyles from '../components/SelectedRowStyles';

export default function ProtectedLayoutClient({
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
      <div className={`min-h-screen bg-gray-50 snefuru-app-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="snefuru-sidebar-wrapper">
          <SidebarMenu isOpen={sidebarOpen} onToggle={toggleSidebar} />
        </div>
        
        <div className="snefuru-content-wrapper">
          <Header />
          <main className="pt-0 pb-6 px-4">
            {children}
          </main>
        </div>
        
        <SelectedRowStyles />
      </div>
    </ProtectedRoute>
  );
}