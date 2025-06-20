'use client';

import { useEffect } from 'react';

export default function Fanex1Page() {
  useEffect(() => {
    document.title = '/fanex1 - Snefuru';
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">/fanex1 - Prex System Tools (Elementor)</h1>
        <p className="mt-2 text-gray-600">
          zeeprex related tools etc. from the wp plugin
        </p>
      </div>
    </div>
  );
}