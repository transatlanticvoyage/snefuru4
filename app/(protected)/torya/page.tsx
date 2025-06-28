"use client";

import React from 'react';
import ProtectedPageHeader from '@/app/components/ProtectedPageHeader';

export default function ToryaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ProtectedPageHeader />
      {/* Page content will be added later */}
    </div>
  );
}