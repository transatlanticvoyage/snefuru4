'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import JexplanationsTable from './components/JexplanationsTable';

export default function JexplainClient() {
  const { user } = useAuth();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [activePopupTab, setActivePopupTab] = useState<'ptab1' | 'ptab2' | 'ptab3' | 'ptab4' | 'ptab5' | 'ptab6' | 'ptab7'>('ptab1');

  useEffect(() => {
    // Handle URL parameters for popup and tab state
    const urlParams = new URLSearchParams(window.location.search);
    const fpop = urlParams.get('fpop');
    const ptab1 = urlParams.get('ptab1');
    const ptab2 = urlParams.get('ptab2');
    const ptab3 = urlParams.get('ptab3');
    const ptab4 = urlParams.get('ptab4');
    const ptab5 = urlParams.get('ptab5');
    const ptab6 = urlParams.get('ptab6');
    const ptab7 = urlParams.get('ptab7');
    
    // Auto-open popup if fpop=open is in URL
    if (fpop === 'open') {
      setIsPopupOpen(true);
      
      // Set active tab based on URL parameters
      if (ptab1 === 'active') {
        setActivePopupTab('ptab1');
      } else if (ptab2 === 'active') {
        setActivePopupTab('ptab2');
      } else if (ptab3 === 'active') {
        setActivePopupTab('ptab3');
      } else if (ptab4 === 'active') {
        setActivePopupTab('ptab4');
      } else if (ptab5 === 'active') {
        setActivePopupTab('ptab5');
      } else if (ptab6 === 'active') {
        setActivePopupTab('ptab6');
      } else if (ptab7 === 'active') {
        setActivePopupTab('ptab7');
      }
    }
  }, []);

  // Update URL parameters for popup state
  const updatePopupURL = (fpopOpen: boolean, tabActive?: string) => {
    const url = new URL(window.location.href);
    
    if (fpopOpen) {
      url.searchParams.set('fpop', 'open');
      
      // Clear all tab parameters first
      ['ptab1', 'ptab2', 'ptab3', 'ptab4', 'ptab5', 'ptab6', 'ptab7'].forEach(tab => {
        url.searchParams.delete(tab);
      });
      
      // Set the active tab parameter
      if (tabActive) {
        url.searchParams.set(tabActive, 'active');
      } else {
        // Default to ptab1 if no specific tab provided
        url.searchParams.set('ptab1', 'active');
      }
    } else {
      // Remove popup and all tab parameters when popup is closed
      url.searchParams.delete('fpop');
      ['ptab1', 'ptab2', 'ptab3', 'ptab4', 'ptab5', 'ptab6', 'ptab7'].forEach(tab => {
        url.searchParams.delete(tab);
      });
    }
    
    // Update URL without triggering page reload
    window.history.replaceState({}, '', url.toString());
  };

  // Handle popup open/close with URL updates
  const handlePopupOpen = () => {
    setIsPopupOpen(true);
    
    // Check if URL has specific tab parameter
    const urlParams = new URLSearchParams(window.location.search);
    const hasTabInUrl = ['ptab1', 'ptab2', 'ptab3', 'ptab4', 'ptab5', 'ptab6', 'ptab7']
      .some(tab => urlParams.get(tab) === 'active');
    
    if (!hasTabInUrl) {
      // No tab specified in URL, use last remembered tab from localStorage
      const lastTab = localStorage.getItem('jexplain_lastActiveTab') || 'ptab1';
      setActivePopupTab(lastTab as any);
      updatePopupURL(true, lastTab);
    } else {
      // URL has tab specified, use current activePopupTab
      updatePopupURL(true, activePopupTab);
    }
  };

  const handlePopupClose = () => {
    setIsPopupOpen(false);
    updatePopupURL(false);
  };

  // Handle tab changes with URL updates and localStorage
  const handleTabChange = (tab: string) => {
    setActivePopupTab(tab as any);
    localStorage.setItem('jexplain_lastActiveTab', tab); // Remember this tab for next time
    updatePopupURL(true, tab);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Please log in to access this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <div className="mb-4">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800">
            ← Back to Admin
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold mb-6">Jexplain Manager</h1>
        <p className="text-gray-600 mb-6">Internal note storage system for admin use</p>
        
        {/* Functions popup button */}
        <div className="mb-6">
          <button
            onClick={handlePopupOpen}
            className="font-bold text-white rounded"
            style={{
              backgroundColor: '#800000', // maroon color
              fontSize: '20px',
              paddingLeft: '14px',
              paddingRight: '14px',
              paddingTop: '10px',
              paddingBottom: '10px'
            }}
          >
            functions popup
          </button>
        </div>
      </div>
      
      {/* Popup Modal */}
      {isPopupOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white w-full h-full max-w-[95vw] max-h-[95vh] rounded-lg shadow-xl relative overflow-hidden">
            {/* Header bar */}
            <div 
              className="absolute top-0 left-0 right-0 flex items-center px-4"
              style={{ 
                height: '50px',
                backgroundColor: '#2563eb',
                color: '#ffffff'
              }}
            >
              <span className="font-semibold">Jexplain Functions</span>
              
              {/* Close button in header */}
              <button
                onClick={handlePopupClose}
                className="absolute right-0 top-0 bg-gray-400 text-gray-800 font-bold flex items-center justify-center hover:bg-gray-500 transition-colors"
                style={{
                  width: '260px',
                  height: '50px',
                  border: '2px solid #4a4a4a',
                  fontSize: '14px',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ fontSize: '20px' }}>×</div>
                <div style={{ fontSize: '12px', lineHeight: '12px', textAlign: 'center' }}>
                  CLOSE POPUP
                </div>
              </button>
            </div>
            
            {/* Popup content - adjusted to start below header */}
            <div className="h-full" style={{ paddingTop: '50px' }}>
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 bg-gray-50">
                <nav className="flex">
                  {['ptab1', 'ptab2', 'ptab3', 'ptab4', 'ptab5', 'ptab6', 'ptab7'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabChange(tab)}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activePopupTab === tab
                          ? 'border-blue-500 text-blue-600 bg-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>
              
              {/* Tab Content */}
              <div className="p-8 h-full overflow-auto">
                {activePopupTab === 'ptab1' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Content for ptab1</h3>
                    <p className="text-gray-600">This is the content area for ptab1.</p>
                  </div>
                )}
                {activePopupTab === 'ptab2' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Content for ptab2</h3>
                    <p className="text-gray-600">This is the content area for ptab2.</p>
                  </div>
                )}
                {activePopupTab === 'ptab3' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Content for ptab3</h3>
                    <p className="text-gray-600">This is the content area for ptab3.</p>
                  </div>
                )}
                {activePopupTab === 'ptab4' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Content for ptab4</h3>
                    <p className="text-gray-600">This is the content area for ptab4.</p>
                  </div>
                )}
                {activePopupTab === 'ptab5' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Content for ptab5</h3>
                    <p className="text-gray-600">This is the content area for ptab5.</p>
                  </div>
                )}
                {activePopupTab === 'ptab6' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Content for ptab6</h3>
                    <p className="text-gray-600">This is the content area for ptab6.</p>
                  </div>
                )}
                {activePopupTab === 'ptab7' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Content for ptab7</h3>
                    <p className="text-gray-600">This is the content area for ptab7.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <JexplanationsTable />
    </div>
  );
}