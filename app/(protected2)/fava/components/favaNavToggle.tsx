'use client';

import React, { useState, useEffect } from 'react';

export default function FavaNavToggle() {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  useEffect(() => {
    // Load header visibility state from localStorage
    const savedHeaderVisibility = localStorage.getItem('fava-header-visible');
    if (savedHeaderVisibility !== null) {
      setHeaderVisible(JSON.parse(savedHeaderVisibility));
    }

    // Load sidebar visibility state from localStorage
    const savedSidebarVisibility = localStorage.getItem('fava-sidebar-visible');
    if (savedSidebarVisibility !== null) {
      setSidebarVisible(JSON.parse(savedSidebarVisibility));
    }
  }, []);

  const toggleHeader = () => {
    const newVisibility = !headerVisible;
    setHeaderVisible(newVisibility);
    localStorage.setItem('fava-header-visible', JSON.stringify(newVisibility));
    
    // Dispatch custom event for header components
    window.dispatchEvent(new Event('fava-header-toggle'));
  };

  const toggleSidebar = () => {
    const newVisibility = !sidebarVisible;
    setSidebarVisible(newVisibility);
    localStorage.setItem('fava-sidebar-visible', JSON.stringify(newVisibility));
    
    // Dispatch custom event for sidebar components
    window.dispatchEvent(new Event('fava-sidebar-toggle'));
  };

  return (
    <div className="fava-nav-toggle-container">
      {/* Header Toggle (Top Half) */}
      <button
        className="fava-nav-toggle fava-header-toggle"
        onClick={toggleHeader}
        title={headerVisible ? 'Hide header' : 'Show header'}
        aria-label={headerVisible ? 'Hide header' : 'Show header'}
      >
        {headerVisible ? '▲' : '△'}
      </button>
      
      {/* Sidebar Toggle (Bottom Half) */}
      <button
        className="fava-nav-toggle fava-sidebar-toggle"
        onClick={toggleSidebar}
        title={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
        aria-label={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
      >
        {sidebarVisible ? '◀' : '▷'}
      </button>
      
      <style jsx>{`
        .fava-nav-toggle-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1002;
          display: flex;
          flex-direction: column;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .fava-nav-toggle {
          width: 48px;
          height: 24px;
          border: none;
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        
        .fava-header-toggle {
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px 8px 0 0;
        }
        
        .fava-sidebar-toggle {
          border-radius: 0 0 8px 8px;
        }
        
        .fava-nav-toggle:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
          transform: scale(1.05);
        }
        
        .fava-nav-toggle:active {
          transform: scale(0.95);
        }
        
        @media (max-width: 768px) {
          .fava-nav-toggle-container {
            top: 15px;
            right: 15px;
          }
          
          .fava-nav-toggle {
            width: 42px;
            height: 21px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}