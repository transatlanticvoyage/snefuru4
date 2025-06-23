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
      <div className="min-h-screen bg-gray-50">
        <div 
          className={`transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'transform translate-x-64' : ''
          }`}
        >
          <Header />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
        <SidebarMenu isOpen={sidebarOpen} onToggle={toggleSidebar} />
        <SelectedRowStyles />
      </div>
    </ProtectedRoute>
  );
} 