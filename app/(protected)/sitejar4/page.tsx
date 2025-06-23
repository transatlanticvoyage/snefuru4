'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import F71CreateSiteForm from './components/F71CreateSiteForm';
import SitesprenTable from './components/SitesprenTable';

export default function Sitejar4Page() {
  const [sitesprenData, setSitesprenData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInternalId, setUserInternalId] = useState<string | null>(null);
  const [debugExpanded, setDebugExpanded] = useState(false);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteNotification, setDeleteNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    document.title = 'sitejar4 - Snefuru';
    
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
    const fetchSitesprenData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // First get the internal user ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (userError || !userData) {
          setError('User not found');
          setLoading(false);
          return;
        }

        setUserInternalId(userData.id);

        // Fetch user's sitespren data via API (bypasses RLS)
        console.log('Fetching sitespren data for user ID:', userData.id);
        
        const response = await fetch(`/api/get_sitespren_data?user_internal_id=${userData.id}`);
        const result = await response.json();

        console.log('API fetch result:', result);

        if (result.success) {
          console.log('Setting sitespren data:', result.data);
          setSitesprenData(result.data || []);
        } else {
          console.error('Error fetching sitespren:', result.error);
          setError('Error fetching sites data');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSitesprenData();
  }, [user?.id, supabase]);

  // Function to refetch data after creating new sites
  const refetchSitesprenData = async () => {
    console.log('Refetching data...', { userId: user?.id, userInternalId });
    
    if (!user?.id || !userInternalId) {
      console.log('Missing user data for refetch');
      return;
    }

    try {
      const response = await fetch(`/api/get_sitespren_data?user_internal_id=${userInternalId}`);
      const result = await response.json();

      console.log('Refetch API result:', result);

      if (result.success) {
        console.log('Setting new data:', result.data);
        setSitesprenData(result.data || []);
      } else {
        console.error('Error in refetch:', result.error);
      }
    } catch (err) {
      console.error('Error refetching data:', err);
    }
  };

  // Handle selection change from table
  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedSiteIds(selectedIds);
  };

  // f18_deletesites function
  const f18_deletesites = async () => {
    if (selectedSiteIds.length === 0) {
      setDeleteNotification({
        type: 'error',
        message: 'Please select at least one site to delete'
      });
      return;
    }

    if (!userInternalId) {
      setDeleteNotification({
        type: 'error',
        message: 'User verification failed'
      });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedSiteIds.length} selected site(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteNotification(null);

    try {
      const response = await fetch('/api/f18_deletesites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_ids: selectedSiteIds,
          user_internal_id: userInternalId
        }),
      });

      const result = await response.json();

      if (result.success) {
        setDeleteNotification({
          type: 'success',
          message: `Successfully deleted ${result.data?.deletedCount || 0} site(s)`
        });
        setSelectedSiteIds([]); // Clear selection
        await refetchSitesprenData(); // Refresh the table
      } else {
        setDeleteNotification({
          type: 'error',
          message: result.error || 'Failed to delete sites'
        });
      }
    } catch (error) {
      console.error('Error deleting sites:', error);
      setDeleteNotification({
        type: 'error',
        message: 'An error occurred while deleting sites'
      });
    } finally {
      setIsDeleting(false);
      // Clear notification after 5 seconds
      setTimeout(() => setDeleteNotification(null), 5000);
    }
  };

  if (!user) {
    return (
      <div className="pr-4">
        <div className="text-center">
          <p>Please sign in to manage your sites.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pr-4">
        <div className="text-center">
          <p>Loading sites data...</p>
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Site Management</h1>
        <p className="text-gray-600">
          Manage your web properties and WordPress sites
        </p>
      </div>

      {/* Delete notification */}
      {deleteNotification && (
        <div className={`mb-4 p-4 rounded-md ${
          deleteNotification.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {deleteNotification.message}
        </div>
      )}

      {/* F71 Create Site Form */}
      <F71CreateSiteForm 
        userInternalId={userInternalId!}
        onSitesCreated={refetchSitesprenData}
      />

      {/* Bulk Actions */}
      {selectedSiteIds.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-800">
                {selectedSiteIds.length} site(s) selected
              </h3>
              <p className="text-sm text-red-600">
                Choose an action to perform on the selected sites.
              </p>
            </div>
            <button
              onClick={f18_deletesites}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-md transition-colors"
            >
              {isDeleting ? 'Deleting...' : 'f18_deletesites'}
            </button>
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="mb-4 bg-yellow-100 border border-yellow-400 rounded overflow-hidden">
        <div 
          className="flex items-center justify-between p-2 cursor-pointer hover:bg-yellow-200"
          onClick={() => setDebugExpanded(!debugExpanded)}
        >
          <h3 className="font-bold text-sm">Debug Info (Count: {sitesprenData.length})</h3>
          <button className="text-yellow-800 hover:text-yellow-900">
            {debugExpanded ? '−' : '+'}
          </button>
        </div>
        {debugExpanded && (
          <div className="p-4 pt-0 border-t border-yellow-300">
            <div className="space-y-1 text-sm">
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Internal User ID:</strong> {userInternalId}</p>
              <p><strong>Data Count:</strong> {sitesprenData.length}</p>
              <div>
                <strong>Data:</strong>
                <pre className="mt-1 text-xs bg-yellow-50 p-2 rounded border overflow-x-auto">
                  {JSON.stringify(sitesprenData, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sitespren Table */}
      <SitesprenTable 
        data={sitesprenData} 
        userId={user.id}
        onSelectionChange={handleSelectionChange}
        onDataUpdate={setSitesprenData}
      />
    </div>
  );
}