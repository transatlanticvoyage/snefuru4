'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import HostAccountsUITableV2 from './components/HostAccountsUITableV2';

export default function Haccjar2Page() {
  const [hostAccountsData, setHostAccountsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInternalId, setUserInternalId] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    document.title = 'haccjar2 - Snefuru';
  }, []);

  useEffect(() => {
    const fetchHostAccountsData = async () => {
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

        // Fetch user's host account data via API (bypasses RLS)
        console.log('Fetching host account data for user ID (V2):', userData.id);
        
        const response = await fetch(`/api/get_hostaccount_data_v2?user_internal_id=${userData.id}`);
        const result = await response.json();

        console.log('API fetch result (V2):', result);

        if (result.success) {
          console.log('Setting host account data (V2):', result.data);
          setHostAccountsData(result.data || []);
        } else {
          console.error('Error fetching host account (V2):', result.error);
          setError('Error fetching host account data');
        }
      } catch (err) {
        console.error('Error (V2):', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchHostAccountsData();
  }, [user?.id, supabase]);

  // Function to refetch data after any modifications
  const refetchHostAccountsData = async () => {
    console.log('Refetching data (V2)...', { userId: user?.id, userInternalId });
    
    if (!user?.id || !userInternalId) {
      console.log('Missing user data for refetch (V2)');
      return;
    }

    try {
      const response = await fetch(`/api/get_hostaccount_data_v2?user_internal_id=${userInternalId}`);
      const result = await response.json();

      console.log('Refetch API result (V2):', result);

      if (result.success) {
        console.log('Setting new data (V2):', result.data);
        setHostAccountsData(result.data || []);
      } else {
        console.error('Error in refetch (V2):', result.error);
      }
    } catch (err) {
      console.error('Error refetching data (V2):', err);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <p>Please sign in to manage your host account.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <p>Loading host account data...</p>
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
        <h1 className="text-3xl font-bold mb-2">Host Accounts Management V2</h1>
        <p className="text-gray-600">
          Manage your hosting provider and domain registrar accounts
        </p>
      </div>

      {/* Host Accounts Table V2 */}
      <HostAccountsUITableV2 
        data={hostAccountsData} 
        userId={user.id}
        onDataChange={refetchHostAccountsData}
      />
    </div>
  );
}