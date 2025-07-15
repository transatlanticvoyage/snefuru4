'use client';

import React, { useState } from 'react';
import { ICON_REGISTRY, EXPANDED_ICON_CATEGORIES } from './iconRegistry';
import { IconSelectorProps, IconCategory } from './types/iconTypes';
import IconPreview from './iconPreview';

export default function IconSelector({ 
  selectedIcon, 
  selectedColor = '#666666',
  onIconChange, 
  onColorChange,
  category,
  size = 16 
}: IconSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<IconCategory | 'all'>('all');

  const filteredIcons = ICON_REGISTRY.filter(icon => {
    if (category && !icon.usageContexts.includes(category)) return false;
    if (activeCategory === 'all') return true;
    return icon.category === activeCategory;
  });

  const categories = EXPANDED_ICON_CATEGORIES;

  const defaultColors = [
    '#666666', '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#800080', '#ffa500', '#800000'
  ];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Current Selection Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#fff',
          cursor: 'pointer',
          minWidth: '120px'
        }}
      >
        <IconPreview 
          iconName={selectedIcon} 
          iconColor={selectedColor} 
          size={size} 
        />
        <span style={{ fontSize: '14px', color: '#333', flex: 1 }}>
          {selectedIcon || 'Select icon'}
        </span>
        <span style={{ fontSize: '12px', color: '#999' }}>▼</span>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: '400px',
            overflowY: 'auto',
            minWidth: '300px'
          }}
        >
          {/* Category Tabs */}
          <div style={{ 
            display: 'flex', 
            borderBottom: '1px solid #eee',
            backgroundColor: '#f8f8f8'
          }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: activeCategory === cat ? '#fff' : 'transparent',
                  borderBottom: activeCategory === cat ? '2px solid #007cba' : '2px solid transparent',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Icon Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '4px',
            padding: '12px'
          }}>
            {filteredIcons.map(icon => (
              <div
                key={icon.iconName}
                onClick={() => {
                  onIconChange(icon.iconName);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  backgroundColor: selectedIcon === icon.iconName ? '#e3f2fd' : 'transparent',
                  border: selectedIcon === icon.iconName ? '1px solid #007cba' : '1px solid transparent'
                }}
                title={icon.displayName}
              >
                <IconPreview 
                  iconName={icon.iconName} 
                  iconColor={selectedColor} 
                  size={size} 
                />
                <span style={{ fontSize: '10px', color: '#666', textAlign: 'center' }}>
                  {icon.displayName}
                </span>
              </div>
            ))}
          </div>

          {/* Color Picker */}
          <div style={{ 
            borderTop: '1px solid #eee',
            padding: '12px'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
              Color:
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '4px'
            }}>
              {defaultColors.map(color => (
                <div
                  key={color}
                  onClick={() => onColorChange(color)}
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: color,
                    border: selectedColor === color ? '2px solid #007cba' : '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  title={color}
                />
              ))}
            </div>
            
            {/* Custom Color Input */}
            <div style={{ marginTop: '8px' }}>
              <input
                type="text"
                value={selectedColor}
                onChange={(e) => onColorChange(e.target.value)}
                placeholder="#666666"
                style={{
                  width: '100%',
                  padding: '4px 8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}