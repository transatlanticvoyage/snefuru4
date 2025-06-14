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
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    document.title = 'Site Management - Snefuru';
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

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <p>Please sign in to manage your sites.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <p>Loading sites data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Site Management</h1>
        <p className="text-gray-600">
          Manage your web properties and WordPress sites
        </p>
      </div>

      {/* F71 Create Site Form */}
      <F71CreateSiteForm 
        userInternalId={userInternalId!}
        onSitesCreated={refetchSitesprenData}
      />

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
      />
    </div>
  );
}