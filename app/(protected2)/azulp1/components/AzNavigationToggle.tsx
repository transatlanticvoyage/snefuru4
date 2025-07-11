'use client';

import React from 'react';

interface AzNavigationToggleProps {
  isVisible: boolean;
  onToggle: () => void;
}

export default function AzNavigationToggle({ isVisible, onToggle }: AzNavigationToggleProps) {
  return (
    <button
      className="az-nav-toggle"
      onClick={onToggle}
      title={isVisible ? 'Hide navigation' : 'Show navigation'}
      aria-label={isVisible ? 'Hide navigation' : 'Show navigation'}
    >
      {isVisible ? '✕' : '☰'}
    </button>
  );
}