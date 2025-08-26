'use client';

import React, { useEffect, useState } from 'react';

interface DriggsActionsFeedbackProps {
  isVisible: boolean;
  message: string;
  onComplete: () => void;
}

const DriggsActionsFeedback: React.FC<DriggsActionsFeedbackProps> = ({
  isVisible,
  message,
  onComplete
}) => {
  const [overlayOpacity, setOverlayOpacity] = useState(0);

  useEffect(() => {
    if (isVisible) {
      // Fade in (0.5s)
      setTimeout(() => setOverlayOpacity(1), 50);
      
      // Stay visible (1s)
      setTimeout(() => {
        // Fade out (1s)
        setOverlayOpacity(0);
      }, 1500);
      
      // Complete callback after fade out
      setTimeout(() => {
        onComplete();
      }, 2500);
    } else {
      setOverlayOpacity(0);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
      style={{
        opacity: overlayOpacity,
        transition: 'opacity 0.5s ease-in-out'
      }}
    >
      <div 
        className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg font-medium"
        style={{
          fontSize: '16px'
        }}
      >
        {message}
      </div>
    </div>
  );
};

export default DriggsActionsFeedback;