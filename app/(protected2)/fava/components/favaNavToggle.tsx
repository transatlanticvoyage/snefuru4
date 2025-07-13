'use client';

import React, { useState, useEffect } from 'react';

export default function FavaNavToggle() {
  const [navVisible, setNavVisible] = useState(true);

  useEffect(() => {
    // Load navigation visibility state from localStorage
    const savedVisibility = localStorage.getItem('fava-nav-visible');
    if (savedVisibility !== null) {
      setNavVisible(JSON.parse(savedVisibility));
    }
  }, []);

  const toggleNav = () => {
    const newVisibility = !navVisible;
    setNavVisible(newVisibility);
    localStorage.setItem('fava-nav-visible', JSON.stringify(newVisibility));
    
    // Dispatch custom event for navigation components
    window.dispatchEvent(new Event('fava-nav-toggle'));
  };

  return (
    <button
      className="fava-nav-toggle"
      onClick={toggleNav}
      title={navVisible ? 'Hide navigation' : 'Show navigation'}
      aria-label={navVisible ? 'Hide navigation' : 'Show navigation'}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      
      <style jsx>{`
        .fava-nav-toggle {
          position: fixed;
          top: 4px;
          left: 4px;
          z-index: 1002;
          padding: 8px;
          background: #2563eb;
          border: 1px solid #1d4ed8;
          border-radius: 6px;
          color: white;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .fava-nav-toggle:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .fava-nav-toggle:active {
          background: #1e40af;
          transform: translateY(0);
        }
        
        @media (max-width: 768px) {
          .fava-nav-toggle {
            top: 2px;
            left: 2px;
            padding: 6px;
          }
        }
      `}</style>
    </button>
  );
}