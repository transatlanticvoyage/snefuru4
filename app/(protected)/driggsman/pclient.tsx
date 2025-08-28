'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import DriggsmanTable from './components/DriggsmanTable';
import dynamic from 'next/dynamic';



export default function DriggsmanClient() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isHeaderVisible, setIsHeaderVisible] = useState<boolean>(() => {
    // Initialize from localStorage with default as false (hidden)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('driggsman-header-visible');
      return saved === null ? false : saved === 'true';
    }
    return false;
  });

  // State for tundra chamber visibility
  const [showTundraChamber, setShowTundraChamber] = useState<boolean>(() => {
    // Initialize from URL parameter
    if (typeof window !== 'undefined') {
      const urlParam = new URLSearchParams(window.location.search).get('showtundrachamber');
      return urlParam === 'yes';
    }
    return false;
  });

  // Controls state for pagination and search
  const [paginationControls, setPaginationControls] = useState<{
    PaginationControls: () => JSX.Element;
    ColumnPaginationControls: () => JSX.Element;
  } | null>(null);

  // Button states moved from DriggsmanTable
  const [showVerificationColumn, setShowVerificationColumn] = useState(false);
  const [showCompetitorSites, setShowCompetitorSites] = useState(false);
  const [sitesCount, setSitesCount] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // Ensure URL parameter is always present and sync with state
  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);
    const currentParam = currentParams.get('showtundrachamber');
    
    // If parameter doesn't exist or state doesn't match URL, update URL
    if (currentParam !== (showTundraChamber ? 'yes' : 'no')) {
      currentParams.set('showtundrachamber', showTundraChamber ? 'yes' : 'no');
      const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [showTundraChamber]);

  // Initialize URL parameter on first load if missing
  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);
    if (!currentParams.has('showtundrachamber')) {
      currentParams.set('showtundrachamber', 'no');
      const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, []);

  // Save header visibility state to localStorage and update body class
  useEffect(() => {
    localStorage.setItem('driggsman-header-visible', isHeaderVisible.toString());
    
    // Add/remove class on body to hide main header
    if (isHeaderVisible) {
      document.body.classList.remove('driggsman-hide-main-header');
    } else {
      document.body.classList.add('driggsman-hide-main-header');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('driggsman-hide-main-header');
    };
  }, [isHeaderVisible]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Pagination and Search Controls */}
      {paginationControls && (
        <div className="px-6 py-1 border-b">
          <div 
            className="flex items-center space-x-4"
            style={{
              backgroundColor: '#000000',
              backgroundImage: `
                radial-gradient(1px 1px at 50px 25px, #722F37, transparent),
                radial-gradient(2px 2px at 120px 15px, #808080, transparent),
                radial-gradient(1px 1px at 200px 35px, #FFD700, transparent),
                radial-gradient(2px 2px at 80px 40px, #ADD8E6, transparent),
                radial-gradient(1px 1px at 300px 20px, #722F37, transparent),
                radial-gradient(3px 3px at 180px 10px, #808080, transparent),
                radial-gradient(1px 1px at 400px 45px, #FFD700, transparent),
                radial-gradient(2px 2px at 250px 30px, #ADD8E6, transparent),
                radial-gradient(1px 1px at 500px 15px, #722F37, transparent),
                radial-gradient(2px 2px at 350px 40px, #808080, transparent),
                radial-gradient(4px 4px at 450px 25px, #FFD700, transparent),
                radial-gradient(1px 1px at 600px 35px, #ADD8E6, transparent),
                radial-gradient(2px 2px at 550px 10px, #722F37, transparent),
                radial-gradient(1px 1px at 700px 20px, #808080, transparent),
                radial-gradient(3px 3px at 650px 45px, #FFD700, transparent),
                radial-gradient(1px 1px at 750px 30px, #ADD8E6, transparent),
                radial-gradient(2px 2px at 800px 15px, #722F37, transparent),
                radial-gradient(1px 1px at 900px 40px, #808080, transparent),
                radial-gradient(2px 2px at 850px 25px, #FFD700, transparent),
                radial-gradient(1px 1px at 950px 35px, #ADD8E6, transparent),
                radial-gradient(3px 3px at 1000px 10px, #722F37, transparent),
                radial-gradient(1px 1px at 1100px 45px, #808080, transparent),
                radial-gradient(2px 2px at 1050px 20px, #FFD700, transparent),
                radial-gradient(1px 1px at 1150px 30px, #ADD8E6, transparent),
                radial-gradient(2px 2px at 1200px 15px, #722F37, transparent),
                radial-gradient(1px 1px at 1250px 40px, #808080, transparent),
                radial-gradient(3px 3px at 1300px 25px, #FFD700, transparent),
                radial-gradient(1px 1px at 1350px 35px, #ADD8E6, transparent),
                radial-gradient(2px 2px at 1400px 10px, #722F37, transparent),
                radial-gradient(1px 1px at 30px 10px, #808080, transparent),
                radial-gradient(2px 2px at 150px 50px, #FFD700, transparent),
                radial-gradient(1px 1px at 270px 5px, #ADD8E6, transparent),
                radial-gradient(3px 3px at 380px 15px, #722F37, transparent),
                radial-gradient(1px 1px at 480px 35px, #808080, transparent),
                radial-gradient(2px 2px at 580px 45px, #FFD700, transparent),
                radial-gradient(1px 1px at 680px 5px, #ADD8E6, transparent),
                radial-gradient(2px 2px at 780px 35px, #722F37, transparent),
                radial-gradient(1px 1px at 880px 15px, #808080, transparent),
                radial-gradient(3px 3px at 980px 45px, #FFD700, transparent),
                radial-gradient(1px 1px at 1080px 25px, #ADD8E6, transparent),
                radial-gradient(2px 2px at 1180px 5px, #722F37, transparent),
                radial-gradient(1px 1px at 70px 48px, #FFD700, transparent),
                radial-gradient(2px 2px at 220px 8px, #722F37, transparent),
                radial-gradient(1px 1px at 340px 42px, #808080, transparent),
                radial-gradient(2px 2px at 420px 5px, #ADD8E6, transparent),
                radial-gradient(1px 1px at 570px 28px, #722F37, transparent),
                radial-gradient(3px 3px at 720px 48px, #FFD700, transparent),
                radial-gradient(1px 1px at 820px 8px, #808080, transparent),
                radial-gradient(2px 2px at 920px 32px, #ADD8E6, transparent),
                radial-gradient(1px 1px at 1020px 48px, #722F37, transparent),
                radial-gradient(2px 2px at 1120px 5px, #FFD700, transparent),
                radial-gradient(1px 1px at 1270px 18px, #808080, transparent),
                radial-gradient(3px 3px at 1380px 42px, #ADD8E6, transparent),
                radial-gradient(1px 1px at 160px 28px, #722F37, transparent)
              `,
              backgroundSize: '100% 100%',
              padding: '8px',
              borderRadius: '4px'
            }}
          >
            {/* Andromeda Logo */}
            <div 
              className="bg-black rounded flex items-center"
              style={{
                width: '280px',
                height: '50px',
                border: '1px solid red',
                backgroundImage: `
                  radial-gradient(1px 1px at 25px 12px, #722F37, transparent),
                  radial-gradient(2px 2px at 65px 8px, #808080, transparent),
                  radial-gradient(1px 1px at 110px 18px, #FFD700, transparent),
                  radial-gradient(2px 2px at 35px 28px, #ADD8E6, transparent),
                  radial-gradient(1px 1px at 85px 35px, #722F37, transparent),
                  radial-gradient(3px 3px at 145px 15px, #808080, transparent),
                  radial-gradient(1px 1px at 55px 42px, #FFD700, transparent),
                  radial-gradient(2px 2px at 15px 38px, #ADD8E6, transparent),
                  radial-gradient(1px 1px at 125px 45px, #722F37, transparent),
                  radial-gradient(2px 2px at 75px 6px, #808080, transparent),
                  radial-gradient(4px 4px at 165px 25px, #FFD700, transparent),
                  radial-gradient(1px 1px at 45px 18px, #ADD8E6, transparent),
                  radial-gradient(2px 2px at 95px 48px, #722F37, transparent),
                  radial-gradient(1px 1px at 185px 35px, #808080, transparent),
                  radial-gradient(3px 3px at 155px 8px, #FFD700, transparent),
                  radial-gradient(1px 1px at 115px 28px, #ADD8E6, transparent),
                  radial-gradient(2px 2px at 175px 42px, #722F37, transparent),
                  radial-gradient(1px 1px at 5px 25px, #808080, transparent),
                  radial-gradient(2px 2px at 220px 10px, #808080, transparent),
                  radial-gradient(1px 1px at 250px 30px, #FFD700, transparent),
                  radial-gradient(2px 2px at 270px 40px, #ADD8E6, transparent)
                `,
                backgroundSize: '280px 50px'
              }}
            >
              {/* Logo wrapper with minimal padding and left margin */}
              <div 
                style={{
                  width: '40px',
                  height: '40px',
                  padding: '2px',
                  marginLeft: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img 
                  src="/images/driggsman/andromeda-logo-transparent-trimmed-2.png"
                  alt="Andromeda Logo"
                  style={{
                    width: '36px',
                    height: '36px',
                    objectFit: 'contain'
                  }}
                />
              </div>
              
              {/* Text wrapper moved closer to logo */}
              <div 
                className="text-white font-bold text-xl flex items-center justify-center"
                style={{
                  flex: '1',
                  fontSize: '20px',
                  lineHeight: '1',
                  marginLeft: '-20px'
                }}
              >
                Andromeda Editor
              </div>
            </div>
            {/* Show Page Header Button - moved here as requested */}
            <button
              onClick={() => setIsHeaderVisible(!isHeaderVisible)}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            >
              {isHeaderVisible ? 'Hide Page Header' : 'Show Page Header'}
            </button>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-sm">
              {sitesCount} sites loaded
            </span>
            <div className="flex items-center">
              {paginationControls.PaginationControls()}
            </div>
            <div className="flex items-center">
              {paginationControls.ColumnPaginationControls()}
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Full Width DriggsmanTable */}
      <div className="flex-1 overflow-hidden">
        <DriggsmanTable 
          onControlsRender={setPaginationControls}
          showVerificationColumn={showVerificationColumn}
          showCompetitorSites={showCompetitorSites}
          onSitesCountChange={setSitesCount}
          onShowVerificationColumnChange={setShowVerificationColumn}
          onShowCompetitorSitesChange={setShowCompetitorSites}
          showTundraChamber={showTundraChamber}
          onShowTundraChamberChange={setShowTundraChamber}
        />
      </div>
    </div>
  );
}