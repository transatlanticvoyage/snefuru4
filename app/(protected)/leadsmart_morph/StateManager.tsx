'use client';

import { useState, useCallback, useEffect } from 'react';

interface StateManagerProps {
  currentState: any;
  onLoadState: (state: any) => void;
}

export default function StateManager({ currentState, onLoadState }: StateManagerProps) {
  const [copied, setCopied] = useState(false);
  const [copiedNew, setCopiedNew] = useState(false);
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
          const decodedString = decodeURIComponent(atob(stateParam));
          
          // Check if it has our prefix format (PREFIX|STATE)
          if (decodedString.includes('|')) {
            const [prefix, stateJson] = decodedString.split('|', 2);
            const decodedState = JSON.parse(stateJson);
            onLoadState(decodedState);
          } else {
            // Handle old format without prefix (backward compatibility)
            const decodedState = JSON.parse(decodedString);
            // Remove _id field if it exists from old format
            if (decodedState._id) {
              delete decodedState._id;
            }
            onLoadState(decodedState);
          }
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

  const generateNewUrlAndSave = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Generate a random prefix to make URLs visually distinct
      const randomPrefix = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Create a modified state string with the prefix
      // Format: PREFIX|STATE to make decoding easier
      const stateString = `${randomPrefix}|${JSON.stringify(currentState)}`;
      
      // Encode the prefixed state
      const encoded = btoa(encodeURIComponent(stateString));
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('state', encoded);
      
      // Copy to clipboard first
      navigator.clipboard.writeText(newUrl.toString()).then(() => {
        setCopiedNew(true);
        
        // Force navigation even if URL seems the same
        // Using replace to ensure the page reloads with the new state
        window.location.replace(newUrl.toString());
      }).catch((err) => {
        console.error('Failed to copy to clipboard:', err);
        // Still navigate even if clipboard fails
        window.location.replace(newUrl.toString());
      });
    } catch (error) {
      console.error('Failed to generate new URL:', error);
    }
  }, [currentState]);

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
      
      <button
        onClick={generateNewUrlAndSave}
        className="px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
        title="Generate a new unique URL with current state and copy to clipboard"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>{copiedNew ? 'Copied New URL!' : 'Generate New URL & Save State'}</span>
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