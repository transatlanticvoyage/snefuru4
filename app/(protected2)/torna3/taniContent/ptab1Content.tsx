'use client';

import React from 'react';

interface Torna3Ptab1ContentProps {
  nemtorData: any[];
  visibleColumns: any[];
  totalColumns: number;
}

export default function Torna3Ptab1Content({ 
  nemtorData, 
  visibleColumns, 
  totalColumns 
}: Torna3Ptab1ContentProps) {
  return (
    <div style={{ fontSize: '18px' }}>
      <div style={{ fontWeight: 'bold' }}>future content</div>
      <div>will be going here</div>
    </div>
  );
}