'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface HeaderVisibilityToggleProps {
  onToggle: (visible: boolean) => void;
}

export default function HeaderVisibilityToggle({ onToggle }: HeaderVisibilityToggleProps) {
  const pathname = usePathname();
  const [headerVisible, setHeaderVisible] = useState(true);

  // Load header visibility state from localStorage for current page
  useEffect(() => {
    const storageKey = `header-visibility-${pathname}`;
    const savedState = localStorage.getItem(storageKey);
    const isVisible = savedState !== null ? savedState === 'true' : true;
    
    setHeaderVisible(isVisible);
    onToggle(isVisible);
  }, [pathname, onToggle]);

  const toggleHeaderVisibility = () => {
    const newState = !headerVisible;
    setHeaderVisible(newState);
    onToggle(newState);
    
    // Save to localStorage for this specific page
    const storageKey = `header-visibility-${pathname}`;
    localStorage.setItem(storageKey, newState.toString());
  };

  return (
    <div className="p-4 border-b border-gray-700">
      <button
        onClick={toggleHeaderVisibility}
        className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {headerVisible ? (
            // Eye slash (hide) icon
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.05 8.05M14.12 14.12l1.829 1.829M9.878 9.878l-1.828-1.828m4.242 4.242L14.12 14.12m-4.242-4.242L8.05 8.05m6.07 6.07l1.829 1.829m-1.829-1.829L12.95 12.95"
            />
          ) : (
            // Eye (show) icon
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          )}
        </svg>
        {headerVisible ? 'Hide Header' : 'Show Header'}
      </button>
    </div>
  );
}