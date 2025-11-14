'use client';

import { useState, useCallback, useEffect } from 'react';

interface StateManagerProps {
  currentState: any;
  onLoadState: (state: any) => void;
}

export default function StateManager({ currentState, onLoadState }: StateManagerProps) {
  const [copied, setCopied] = useState(false);
  const [hasUrlState, setHasUrlState] = useState(false);

  useEffect(() => {
    // Check if there's a state in the URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setHasUrlState(urlParams.has('state'));
      
      // Load state on mount
      const stateParam = urlParams.get('state');
      if (stateParam) {
        try {
          const decodedState = JSON.parse(decodeURIComponent(atob(stateParam)));
          onLoadState(decodedState);
        } catch (error) {
          console.error('Failed to load state from URL:', error);
        }
      }
    }
  }, []);

  const saveState = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const encoded = btoa(encodeURIComponent(JSON.stringify(currentState)));
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('state', encoded);
      window.history.pushState({}, '', newUrl.toString());
      setHasUrlState(true);
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }, [currentState]);

  const copyUrl = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    saveState();
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [saveState]);

  const clearState = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('state');
    window.history.pushState({}, '', newUrl.toString());
    window.location.reload();
  }, []);

  return (
    <div className="flex items-center space-x-2 ml-6 pl-6 border-l border-gray-300">
      <button
        onClick={saveState}
        className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
        title="Save current view state to URL"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
        </svg>
        <span>Save State</span>
      </button>
      
      <button
        onClick={copyUrl}
        className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center space-x-2"
        title="Copy shareable URL with current state"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span>{copied ? 'Copied!' : 'Copy URL'}</span>
      </button>
      
      {hasUrlState && (
        <>
          <button
            onClick={clearState}
            className="px-3 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
            title="Clear saved state and reset"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Clear State</span>
          </button>
          
          <div className="flex items-center space-x-1 text-sm text-green-600 font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>State Loaded</span>
          </div>
        </>
      )}
    </div>
  );
}