'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import WaterTable from './components/WaterTable';

export default function ToryaPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gconPieceId, setGconPieceId] = useState<string | null>(null);
  const [gconPiece, setGconPiece] = useState<any>(null);
  const [isTopAreaOpen, setIsTopAreaOpen] = useState<boolean>(true);
  const [isPopulatingUnits, setIsPopulatingUnits] = useState(false);
  const [populateMessage, setPopulateMessage] = useState<string | null>(null);
  const [isRunningF22, setIsRunningF22] = useState(false);
  const [f22Report, setF22Report] = useState<string>('');

  useEffect(() => {
    // Get gcon_piece_id from URL parameters
    const gconPieceIdParam = searchParams?.get('gcon_piece_id');
    if (gconPieceIdParam) {
      setGconPieceId(gconPieceIdParam);
      console.log('Torya: Loaded with gcon_piece_id:', gconPieceIdParam);
    }
    
    // Handle zarno1 state from URL and localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const zarno1Param = urlParams.get('zarno1');
    
    // Try to get saved state from localStorage
    const savedState = localStorage.getItem('torya_zarno1_state');
    
    if (zarno1Param === 'closed') {
      setIsTopAreaOpen(false);
    } else if (zarno1Param === 'open') {
      setIsTopAreaOpen(true);
    } else if (savedState) {
      // Use saved state if no URL param
      setIsTopAreaOpen(savedState === 'open');
    }
    
    setLoading(false);
  }, [searchParams]);

  // Fetch gcon_piece data when gconPieceId is available
  useEffect(() => {
    const fetchGconPiece = async () => {
      if (!user?.id || !gconPieceId) {
        return;
      }

      try {
        // Get user's internal ID first
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (!userData) {
          setError('User not found');
          return;
        }

        // Fetch the gcon_piece
        const { data: gconData, error: gconError } = await supabase
          .from('gcon_pieces')
          .select('id, asn_sitespren_base, mud_title, pelementor_cached, pelementor_edits')
          .eq('id', gconPieceId)
          .eq('fk_users_id', userData.id)
          .single();

        if (gconError) {
          setError('Content piece not found');
          return;
        }

        setGconPiece(gconData);
      } catch (err) {
        console.error('Error fetching gcon_piece:', err);
        setError('Failed to load content');
      }
    };

    fetchGconPiece();
  }, [user?.id, gconPieceId, supabase]);

  // Set browser title based on gcon_piece data
  useEffect(() => {
    if (gconPiece?.asn_sitespren_base) {
      document.title = 'torya_' + gconPiece.asn_sitespren_base;
    } else if (gconPieceId) {
      document.title = 'torya';
    } else {
      document.title = 'torya';
    }
  }, [gconPiece?.asn_sitespren_base, gconPieceId]);

  // Handle accordion state change
  const handleAccordionToggle = (open: boolean) => {
    setIsTopAreaOpen(open);
    
    // Save to localStorage
    localStorage.setItem('torya_zarno1_state', open ? 'open' : 'closed');
    
    // Update URL parameter
    const url = new URL(window.location.href);
    url.searchParams.set('zarno1', open ? 'open' : 'closed');
    window.history.replaceState({}, '', url.toString());
  };

  // Handle populate nemtor_units
  const handlePopulateNemtorUnits = async () => {
    if (!gconPieceId) {
      setPopulateMessage('Error: No gcon_piece_id available');
      return;
    }

    setIsPopulatingUnits(true);
    setPopulateMessage(null);

    try {
      const response = await fetch('/api/populate-nemtor-units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gcon_piece_id: gconPieceId
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPopulateMessage(`✅ ${result.message}`);
      } else {
        setPopulateMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error populating nemtor_units:', error);
      setPopulateMessage('❌ Error: Failed to populate nemtor_units');
    } finally {
      setIsPopulatingUnits(false);
      // Clear message after 5 seconds
      setTimeout(() => setPopulateMessage(null), 5000);
    }
  };

  // Handle f22 function
  const handleRunF22 = async () => {
    if (!gconPieceId) {
      setF22Report('Error: No gcon_piece_id available');
      return;
    }

    setIsRunningF22(true);
    setF22Report('Starting F22 processing...');

    try {
      const response = await fetch('/api/f22-nwpi-to-gcon-pusher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gcon_piece_id: gconPieceId
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setF22Report(result.message || 'F22 function completed successfully');
        
        // Refresh the gcon_piece data to get updated values
        if (user?.id) {
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

          if (userData) {
            const { data: refreshedData } = await supabase
              .from('gcon_pieces')
              .select('id, asn_sitespren_base, mud_title, pelementor_cached, pelementor_edits')
              .eq('id', gconPieceId)
              .eq('fk_users_id', userData.id)
              .single();

            if (refreshedData) {
              setGconPiece(refreshedData);
            }
          }
        }
      } else {
        setF22Report(`Error: ${result.error || 'F22 function failed'}`);
      }
    } catch (error) {
      console.error('Error running F22:', error);
      setF22Report('Error: Failed to run F22 function');
    } finally {
      setIsRunningF22(false);
    }
  };

  // Copy functions
  const handleCopyPelementorCached = () => {
    if (gconPiece?.pelementor_cached) {
      const content = typeof gconPiece.pelementor_cached === 'string' 
        ? gconPiece.pelementor_cached 
        : JSON.stringify(gconPiece.pelementor_cached, null, 2);
      navigator.clipboard.writeText(content);
    }
  };

  const handleCopyPelementorEdits = () => {
    if (gconPiece?.pelementor_edits) {
      const content = typeof gconPiece.pelementor_edits === 'string' 
        ? gconPiece.pelementor_edits 
        : JSON.stringify(gconPiece.pelementor_edits, null, 2);
      navigator.clipboard.writeText(content);
    }
  };

  const handleCopyF22Report = () => {
    if (f22Report) {
      navigator.clipboard.writeText(f22Report);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Please log in to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <div className="mb-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
          <button
            className={`px-4 py-2 font-medium rounded-md transition-colors ${
              isPopulatingUnits
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
            onClick={handlePopulateNemtorUnits}
            disabled={isPopulatingUnits || !gconPieceId}
          >
            {isPopulatingUnits ? 'Populating...' : 'populate nemtor_units'}
          </button>
        </div>
        
        {/* Populate feedback message */}
        {populateMessage && (
          <div className={`mb-4 p-3 rounded-md ${
            populateMessage.startsWith('✅') 
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {populateMessage}
          </div>
        )}
        <h1 className="text-2xl font-bold mb-6">Torya</h1>
        {gconPieceId && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>gcon_piece_id:</strong> {gconPieceId}
              {gconPiece?.asn_sitespren_base && (
                <span className="ml-4">
                  <strong>Site:</strong> {gconPiece.asn_sitespren_base}
                </span>
              )}
            </p>
          </div>
        )}
        <WaterTable 
          gconPieceId={gconPieceId} 
          isTopAreaOpen={isTopAreaOpen}
          handleAccordionToggle={handleAccordionToggle}
          gconPiece={gconPiece}
          isRunningF22={isRunningF22}
          f22Report={f22Report}
          handleRunF22={handleRunF22}
          handleCopyPelementorCached={handleCopyPelementorCached}
          handleCopyPelementorEdits={handleCopyPelementorEdits}
          handleCopyF22Report={handleCopyF22Report}
        />
      </div>
    </div>
  );
}