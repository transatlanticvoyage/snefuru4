'use client';

import React from 'react';

interface Torna3Ptab2ContentProps {
  visibleColumns: any[];
  totalColumns: number;
}

export default function Torna3Ptab2Content({ 
  visibleColumns, 
  totalColumns 
}: Torna3Ptab2ContentProps) {
  return (
    <div style={{ fontSize: '18px' }}>
      <div style={{ fontWeight: 'bold' }}>future content</div>
      <div>will be going here</div>
    </div>
  );
}