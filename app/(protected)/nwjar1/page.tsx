'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import NwpiContentTable from './components/NwpiContentTable';
import NwpiPusherButton from './components/NwpiPusherButton';

export default function NwJar1Page() {
  const [nwpiContent, setNwpiContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClientComponentClient();

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

  return (
    <div className="pr-4">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">/nwjar1 - sync table 1 - (WPSv2)</h1>
            <p className="mt-2 text-gray-600">
              View and manage your synced WordPress content from the nwpi_content table
            </p>
            <p className="mt-1 text-sm text-gray-500">
              db table: nwpi_content
            </p>
          </div>
          <div className="flex-shrink-0 ml-6">
            <NwpiPusherButton 
              data={nwpiContent || []} 
              userId={user.id}
            />
          </div>
        </div>
      </div>

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