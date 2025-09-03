'use client';

import { useEffect, useState, useCallback } from 'react';
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

  // State for sites per view (columnsPerPage)
  const [sitesPerView, setSitesPerView] = useState<number>(() => {
    // Initialize from URL parameter
    if (typeof window !== 'undefined') {
      const urlParam = new URLSearchParams(window.location.search).get('sitesperview');
      const value = urlParam ? parseInt(urlParam) : 1;
      return [1, 2, 5, 10, 15, 20].includes(value) ? value : 1;
    }
    return 1;
  });

  // State for column page
  const [specColumnPage, setSpecColumnPage] = useState<number>(() => {
    // Initialize from URL parameter
    if (typeof window !== 'undefined') {
      const urlParam = new URLSearchParams(window.location.search).get('speccolumnpage');
      const value = urlParam ? parseInt(urlParam) : 1;
      return value > 0 ? value : 1;
    }
    return 1;
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
  
  // Rocket chamber search state
  const [rocketSearchTerm, setRocketSearchTerm] = useState('');
  
  // Shared pagination state for both sky banner and rocket chamber
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Calculate total pages
  const totalPages = Math.ceil(sitesCount / itemsPerPage);
  const totalColumnPages = Math.ceil(100 / sitesPerView); // Using 100 as placeholder for total columns
  
  // Create separate components for the 4 pagination bars in rocket chamber (memoized for performance)
  const RocketRowBar1 = useCallback(() => {
    // Items per page selector - uses shared state
    return (
      <div className="flex items-center">
        <span className="text-xs text-gray-600 mr-2">Rows/page:</span>
        <div className="inline-flex rounded-md shadow-sm" role="group">
          {[10, 20, 50, 100, 200, 500, -1].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setItemsPerPage(value);
                setCurrentPage(1);
              }}
              className={`
                px-2 py-2.5 text-sm font-medium border -mr-px cursor-pointer
                ${value === 10 ? 'rounded-l' : ''}
                ${value === -1 ? 'rounded-r' : ''}
                ${(value === -1 && itemsPerPage === -1) || itemsPerPage === value
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }
              `}
              style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
            >
              {value === -1 ? 'All' : value}
            </button>
          ))}
        </div>
      </div>
    );
  }, [itemsPerPage, setItemsPerPage, setCurrentPage]);
  
  const RocketRowBar2 = useCallback(() => {
    // Page navigation - uses shared state
    return (
      <div className="flex items-center">
        <span className="text-xs text-gray-600 mr-2">Page:</span>
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`
              px-3 py-2 text-sm font-medium border rounded-l-md
              ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}
            `}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            ←
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`
                  px-3 py-2 text-sm font-medium border border-l-0
                  ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}
                `}
                style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`
              px-3 py-2 text-sm font-medium border border-l-0 rounded-r-md
              ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}
            `}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            →
          </button>
        </div>
      </div>
    );
  }, [currentPage, totalPages, setCurrentPage]);
  
  const RocketColumnBar1 = useCallback(() => {
    // Sites per view selector - uses shared state
    return (
      <div className="flex items-center">
        <span className="text-xs text-gray-600 mr-2">Sites/view:</span>
        <div className="inline-flex rounded-md shadow-sm" role="group">
          {[1, 2, 5, 10, 15, 20].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setSitesPerView(value);
                setSpecColumnPage(1);
              }}
              className={`
                px-2 py-2.5 text-sm font-medium border -mr-px cursor-pointer
                ${value === 1 ? 'rounded-l' : ''}
                ${value === 20 ? 'rounded-r' : ''}
                ${sitesPerView === value
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }
              `}
              style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    );
  }, [sitesPerView, setSitesPerView, setSpecColumnPage]);
  
  const RocketColumnBar2 = useCallback(() => {
    // Column page navigation - uses shared state
    return (
      <div className="flex items-center">
        <span className="text-xs text-gray-600 mr-2">Col Page:</span>
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            onClick={() => setSpecColumnPage(Math.max(1, specColumnPage - 1))}
            disabled={specColumnPage === 1}
            className={`
              px-3 py-2 text-sm font-medium border rounded-l-md
              ${specColumnPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}
            `}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            ←
          </button>
          {Array.from({ length: Math.min(5, totalColumnPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setSpecColumnPage(pageNum)}
                className={`
                  px-3 py-2 text-sm font-medium border border-l-0
                  ${specColumnPage === pageNum ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}
                `}
                style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setSpecColumnPage(Math.min(totalColumnPages, specColumnPage + 1))}
            disabled={specColumnPage === totalColumnPages}
            className={`
              px-3 py-2 text-sm font-medium border border-l-0 rounded-r-md
              ${specColumnPage === totalColumnPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}
            `}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            →
          </button>
        </div>
      </div>
    );
  }, [specColumnPage, totalColumnPages, setSpecColumnPage]);

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

  // Sync sitesPerView with URL parameter
  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);
    const currentParam = currentParams.get('sitesperview');
    
    // If parameter doesn't exist or state doesn't match URL, update URL
    if (currentParam !== sitesPerView.toString()) {
      currentParams.set('sitesperview', sitesPerView.toString());
      const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [sitesPerView]);

  // Sync specColumnPage with URL parameter
  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);
    const currentParam = currentParams.get('speccolumnpage');
    
    // If parameter doesn't exist or state doesn't match URL, update URL
    if (currentParam !== specColumnPage.toString()) {
      currentParams.set('speccolumnpage', specColumnPage.toString());
      const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [specColumnPage]);

  // Initialize URL parameters on first load if missing
  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);
    let needsUpdate = false;

    if (!currentParams.has('showtundrachamber')) {
      currentParams.set('showtundrachamber', 'no');
      needsUpdate = true;
    }

    if (!currentParams.has('sitesperview')) {
      currentParams.set('sitesperview', '1');
      needsUpdate = true;
    }

    if (!currentParams.has('speccolumnpage')) {
      currentParams.set('speccolumnpage', '1');
      needsUpdate = true;
    }

    if (needsUpdate) {
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
                minHeight: '70px',
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
                backgroundSize: '280px 70px',
                padding: '8px'
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
              
              {/* Text wrapper with stacked layout */}
              <div 
                className="flex flex-col items-center justify-center"
                style={{
                  flex: '1',
                  marginLeft: '-20px'
                }}
              >
                {/* Tregnar text */}
                <div 
                  style={{
                    color: '#20b2aa',
                    fontSize: '14px',
                    lineHeight: '1',
                    marginBottom: '2px'
                  }}
                >
                  tregnar
                </div>
                
                {/* Andromeda Editor text */}
                <div 
                  className="text-white font-bold"
                  style={{
                    fontSize: '20px',
                    lineHeight: '1',
                    marginBottom: '4px'
                  }}
                >
                  Andromeda Editor
                </div>
                
                {/* View Tutorials button */}
                <a
                  href="/tutorials"
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded px-2 py-1 transition-colors"
                  style={{
                    fontSize: '14px',
                    textDecoration: 'none'
                  }}
                >
                  View Tutorials
                </a>
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

      {/* Spider Chamber Section */}
      <div 
        className="w-full bg-gray-50 border border-black"
        style={{
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'black',
          padding: '16px'
        }}
      >
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
          spider_chamber
        </div>

        {/* Rocket Chamber Div - Contains the 4 pagination button bars */}
        <div className="rocket_chamber_div" style={{ 
          border: '1px solid black', 
          padding: 0,
          margin: 0,
          position: 'relative'
        }}>
          <div style={{ 
            position: 'absolute', 
            top: '4px', 
            left: '4px', 
            fontSize: '16px', 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <svg 
              width="22" 
              height="22" 
              viewBox="0 0 24 24" 
              fill="black"
              style={{ transform: 'rotate(15deg)' }}
            >
              {/* Rocket body */}
              <ellipse cx="12" cy="8" rx="3" ry="6" fill="black"/>
              {/* Rocket nose cone */}
              <path d="M12 2 L15 8 L9 8 Z" fill="black"/>
              {/* Left fin */}
              <path d="M9 12 L7 14 L9 16 Z" fill="black"/>
              {/* Right fin */}
              <path d="M15 12 L17 14 L15 16 Z" fill="black"/>
              {/* Exhaust flames */}
              <path d="M10 14 L9 18 L10.5 16 L12 20 L13.5 16 L15 18 L14 14 Z" fill="black"/>
              {/* Window */}
              <circle cx="12" cy="6" r="1" fill="white"/>
            </svg>
            rocket_chamber
          </div>
          <div style={{ marginTop: '24px', paddingTop: '4px', paddingBottom: 0, paddingLeft: '8px', paddingRight: '8px' }}>
            <div className="flex items-end justify-between">
              <div className="flex items-end space-x-8">
                {/* Row pagination, search box, and column pagination table */}
                <table style={{ borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 'bold' }}>row pagination</span>
                          <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
                            Showing <span style={{ fontWeight: 'bold' }}>{sitesCount}</span> of <span style={{ fontWeight: 'bold' }}>{sitesCount}</span> results
                          </span>
                        </div>
                      </td>
                      <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          search box 2
                        </div>
                      </td>
                      <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          wolf exclusion band
                        </div>
                      </td>
                      <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          column templates
                        </div>
                      </td>
                      <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 'bold' }}>column pagination</span>
                          <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
                            Showing <span style={{ fontWeight: 'bold' }}>{sitesPerView}</span> non-sticky(non wolf band) columns of <span style={{ fontWeight: 'bold' }}>100</span> sourcedef columns
                          </span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid black', padding: '4px' }}>
                        <div className="flex items-end space-x-4">
                          {/* Row Pagination Controls - 2 bars */}
                          <RocketRowBar1 />
                          <RocketRowBar2 />
                        </div>
                      </td>
                      <td style={{ border: '1px solid black', padding: '4px' }}>
                        <div className="flex items-end">
                          <input
                            type="text"
                            value={rocketSearchTerm}
                            onChange={(e) => setRocketSearchTerm(e.target.value)}
                            placeholder="Search sitespren_base..."
                            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm w-full"
                          />
                        </div>
                      </td>
                      <td style={{ border: '1px solid black', padding: '4px' }}>
                        <button
                          onClick={() => {/* No functionality */}}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors"
                        >
                          wolf options
                        </button>
                      </td>
                      <td style={{ border: '1px solid black', padding: '4px' }}>
                        <button
                          onClick={() => {/* No functionality */}}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors"
                        >
                          use the pillarshift coltemp system
                        </button>
                      </td>
                      <td style={{ border: '1px solid black', padding: '4px' }}>
                        <div className="flex items-end space-x-4">
                          {/* Column Pagination Controls - 2 bars */}
                          <RocketColumnBar1 />
                          <RocketColumnBar2 />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

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
          sitesPerView={sitesPerView}
          onSitesPerViewChange={setSitesPerView}
          specColumnPage={specColumnPage}
          onSpecColumnPageChange={setSpecColumnPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          currentPage={currentPage}
          onCurrentPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}