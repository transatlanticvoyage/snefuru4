'use client';

import { useState } from 'react';
import BezelPopup from './BezelPopup';

interface BezelButtonProps {
  showButton?: boolean;
}

export default function BezelButton({ showButton = true }: BezelButtonProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleOpenPopup = () => {
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  if (!showButton) return null;

  return (
    <>
      {/* Bezel Button - positioned below hamburger */}
      <button
        onClick={handleOpenPopup}
        className="fixed z-40 rounded-md shadow-lg border border-gray-600 hover:bg-gray-700 transition-colors"
        style={{ 
          top: '43px', // Position below hamburger (hamburger is at top: 1px with padding)
          left: '1px', 
          backgroundColor: '#c5bf7a',
          width: '41px', // Match hamburger width (p-2 = 8px padding * 2 + icon width)
          padding: '2px',
          fontSize: '12px',
          lineHeight: '1.2',
          wordWrap: 'break-word',
          minHeight: 'auto'
        }}
        title="Open Bezel Configuration"
      >
        <span className="text-gray-800 font-medium">bezel</span>
      </button>

      {/* Bezel Popup */}
      <BezelPopup 
        isOpen={isPopupOpen} 
        onClose={handleClosePopup} 
      />
    </>
  );
}