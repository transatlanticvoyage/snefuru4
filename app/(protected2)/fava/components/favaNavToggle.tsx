'use client';

import React, { useState, useEffect } from 'react';

export default function FavaNavToggle() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Load visibility state from localStorage
    const savedVisibility = localStorage.getItem('fava-nav-visible');
    if (savedVisibility !== null) {
      setIsVisible(JSON.parse(savedVisibility));
    }
  }, []);

  const toggleVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    localStorage.setItem('fava-nav-visible', JSON.stringify(newVisibility));
    
    // Dispatch custom event for same-page components
    window.dispatchEvent(new Event('fava-nav-toggle'));
  };

  return (
    <button
      className="fava-nav-toggle"
      onClick={toggleVisibility}
      title={isVisible ? 'Hide navigation' : 'Show navigation'}
      aria-label={isVisible ? 'Hide navigation' : 'Show navigation'}
    >
      {isVisible ? '✕' : '☰'}
    </button>
  );
}