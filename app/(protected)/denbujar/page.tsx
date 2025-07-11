'use client';

import { useEffect } from 'react';

export default function DenbujarPage() {
  useEffect(() => {
    document.title = 'Denbujar - Snefuru';
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
        Denbujar
      </h1>
      
      <div style={{ 
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        padding: '20px',
        marginTop: '20px'
      }}>
        <p style={{ color: '#6c757d', margin: '0' }}>
          Page content coming soon...
        </p>
      </div>
    </div>
  );
}