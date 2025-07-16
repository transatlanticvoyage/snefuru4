'use client';

import React from 'react';
// TEMPORARILY DISABLED: Icon system imports to avoid compilation errors
// import { LUCIDE_ICON_MAP, LucideIconName } from './iconRegistry';
// import { IconPreviewProps } from './types/iconTypes';

interface IconPreviewProps {
  iconName?: string;
  iconColor?: string;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export default function IconPreview({ 
  iconName, 
  iconColor = '#666666', 
  size = 16, 
  showLabel = false,
  className = ''
}: IconPreviewProps) {
  // TEMPORARILY DISABLED: Always use fallback mode to avoid icon compilation errors
  // This preserves UI spacing while avoiding problematic icon imports
  // TODO: Re-enable icon system once import issues are resolved
  
  return showLabel ? (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div 
        style={{ 
          width: size, 
          height: size, 
          backgroundColor: '#e8e8e8',
          border: '1px solid #ccc',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.max(8, size * 0.4),
          color: '#666'
        }}
        title={`Icon: ${iconName || 'none'}`}
      >
        ⚪
      </div>
      {showLabel && <span style={{ fontSize: '14px', color: '#666' }}>{iconName || 'No icon'}</span>}
    </div>
  ) : (
    <div 
      className={className}
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: '#e8e8e8',
        border: '1px solid #ccc',
        borderRadius: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.max(8, size * 0.4),
        color: '#666'
      }}
      title={`Icon: ${iconName || 'none'}`}
    >
      ⚪
    </div>
  );
}