'use client';

import React from 'react';
import { LUCIDE_ICON_MAP, LucideIconName } from './iconRegistry';
import { IconPreviewProps } from './types/iconTypes';

export default function IconPreview({ 
  iconName, 
  iconColor = '#666666', 
  size = 16, 
  showLabel = false,
  className = ''
}: IconPreviewProps) {
  if (!iconName || !(iconName in LUCIDE_ICON_MAP)) {
    return showLabel ? (
      <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div 
          style={{ 
            width: size, 
            height: size, 
            backgroundColor: '#f0f0f0',
            border: '1px dashed #ccc',
            borderRadius: '2px'
          }} 
        />
        {showLabel && <span style={{ fontSize: '14px', color: '#666' }}>No icon</span>}
      </div>
    ) : (
      <div 
        className={className}
        style={{ 
          width: size, 
          height: size, 
          backgroundColor: '#f0f0f0',
          border: '1px dashed #ccc',
          borderRadius: '2px'
        }} 
      />
    );
  }

  const IconComponent = LUCIDE_ICON_MAP[iconName as LucideIconName];

  if (showLabel) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <IconComponent 
          size={size} 
          color={iconColor}
          style={{ flexShrink: 0 }}
        />
        <span style={{ fontSize: '14px', color: '#666' }}>
          {iconName}
        </span>
      </div>
    );
  }

  return (
    <IconComponent 
      className={className}
      size={size} 
      color={iconColor}
    />
  );
}