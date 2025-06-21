'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import NwpiContentTable from './components/NwpiContentTable';
import NwpiPusherButton from './components/NwpiPusherButton';

export default function NwJar1Page() {
  const [nwpiContent, setNwpiContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    document.title = '/nwjar1 - Snefuru';
    
    // Add custom styles to make main element full width for this page only
    const style = document.createElement('style');
    style.textContent = `
      body > div.min-h-screen.bg-gray-50 > main {
        margin-left: 8px !important;
        margin-right: 0px !important;
        padding-left: 0px !important;
        padding-right: 0px !important;
        max-width: none !important;
        width: calc(100vw - 8px) !important;
        position: relative !important;
      }
      
      /* Ensure content fills available width on all screen sizes */
      @media (min-width: 1280px) {
        body > div.min-h-screen.bg-gray-50 > main {
          width: calc(100vw - 8px) !important;
        }
      }
      
      /* For ultra-wide monitors (27-inch and larger) */
      @media (min-width: 1920px) {
        body > div.min-h-screen.bg-gray-50 > main {
          width: calc(100vw - 8px) !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Cleanup function to remove the style when component unmounts
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const fetchNwpiContent = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // First get the internal user ID
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (!userData) {
          setError('User not found');
          setLoading(false);
          return;
        }

        // Fetch nwpi_content data for this user
        const { data: nwpiContent, error: contentError } = await supabase
          .from('nwpi_content')
          .select('*')
          .eq('fk_users_id', userData.id)
          .order('i_sync_completed_at', { ascending: false });

        if (contentError) {
          console.error('Error fetching nwpi_content:', contentError);
          setError('Error fetching content');
        } else {
          setNwpiContent(nwpiContent || []);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchNwpiContent();
  }, [user?.id, supabase]);

  if (!user) {
    return (
      <div className="pr-4">
        <div className="text-center">
          <p>Please sign in to view your synced content.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pr-4">
        <div className="text-center">
          <p>Loading synced content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pr-4">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  // Get current sitebase from URL
  const currentSitebase = searchParams?.get('sitebase');
  const hasSitebase = Boolean(currentSitebase);

  return (
    <div className="pr-4">
      <div className="mb-8 flex items-center" style={{ gap: '16px' }}>
        <button
          onClick={() => setIsPopupOpen(true)}
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
        
        {/* Go Forward Button */}
        {hasSitebase && currentSitebase ? (
          <Link
            href={`/pedazos1?coltemp=option1&sitebase=${encodeURIComponent(currentSitebase)}`}
            className="font-bold text-gray-600 rounded hover:bg-gray-300 transition-colors"
            style={{
              backgroundColor: '#e5e7eb', // light gray
              fontSize: '20px',
              paddingLeft: '14px',
              paddingRight: '14px',
              paddingTop: '10px',
              paddingBottom: '10px',
              textDecoration: 'none'
            }}
          >
            &gt;&gt; Go Forward To /pedazos1
          </Link>
        ) : (
          <button
            disabled
            className="font-bold text-gray-400 rounded cursor-not-allowed opacity-50"
            style={{
              backgroundColor: '#f3f4f6', // lighter gray for disabled
              fontSize: '20px',
              paddingLeft: '14px',
              paddingRight: '14px',
              paddingTop: '10px',
              paddingBottom: '10px'
            }}
          >
            &gt;&gt; Go Forward To /pedazos1
          </button>
        )}
      </div>

      {/* Popup Modal */}
      {isPopupOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white w-full h-full max-w-[95vw] max-h-[95vh] rounded-lg shadow-xl relative overflow-hidden">
            {/* Blue header bar */}
            <div 
              className="bg-blue-600 text-white absolute top-0 left-0 right-0 flex items-center px-4"
              style={{ height: '50px' }}
            >
              <span className="font-semibold">uel.bar38</span>
              <div 
                className="text-white ml-4 flex items-center kz101"
                style={{
                  padding: '8px',
                  border: '1px solid black',
                  fontSize: '16px'
                }}
              >
                <input
                  type="checkbox"
                  className="mr-2 cursor-pointer"
                  style={{
                    width: '18px',
                    height: '18px'
                  }}
                />
                Use Your Current Selection From Table
              </div>
            </div>
            
            {/* Close button - adjusted position to account for header */}
            <button
              onClick={() => setIsPopupOpen(false)}
              className="absolute right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 z-10"
              style={{ top: '60px' }}
            >
              ×
            </button>
            
            {/* Popup content - adjusted to start below header */}
            <div className="p-8 h-full" style={{ paddingTop: '80px' }}>
              {/* Content will be added here later */}
            </div>
          </div>
        </div>
      )}

      {nwpiContent && nwpiContent.length > 0 ? (
        <NwpiContentTable 
          data={nwpiContent} 
          userId={user.id}
        />
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">
            No synced content found. Use the sync buttons on the sitejar4 page to sync your WordPress sites.
          </p>
        </div>
      )}
    </div>
  );
}