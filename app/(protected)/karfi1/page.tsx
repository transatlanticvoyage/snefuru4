'use client';

import { useEffect } from 'react';

export default function Karfi1Page() {
  useEffect(() => {
    document.title = '/karfi1 - Snefuru';
  }, []);

  return (
    <div className="w-full h-screen bg-gray-100">
      {/* Blank page with solid color background */}
    </div>
  );
}