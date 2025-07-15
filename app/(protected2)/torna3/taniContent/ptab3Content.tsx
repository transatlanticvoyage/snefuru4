'use client';

import React from 'react';

interface Torna3Ptab3ContentProps {
  nemtorData: any[];
  visibleColumns: any[];
}

export default function Torna3Ptab3Content({ 
  nemtorData, 
  visibleColumns 
}: Torna3Ptab3ContentProps) {
  return (
    <div style={{ fontSize: '18px' }}>
      <div style={{ fontWeight: 'bold' }}>future content</div>
      <div>will be going here</div>
    </div>
  );
}