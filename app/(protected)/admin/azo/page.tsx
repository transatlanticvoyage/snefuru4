'use client';

import { useEffect } from 'react';

export default function AzoPage() {
  useEffect(() => {
    document.title = 'Azo Page Creator';
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
        <span style={{ fontWeight: 'bold' }}>Azo Page Creator</span>
        <span style={{ fontWeight: 'normal' }}> (internal snefuru app page creator)</span>
      </h1>
    </div>
  );
}