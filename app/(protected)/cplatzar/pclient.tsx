'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import CallPlatUITable from './components/CallPlatUITable';

export default function CplatzarClient() {
  const [callPlatData, setCallPlatData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInternalId, setUserInternalId] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchCallPlatData = async () => {
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

        // Fetch user's call platform data via API (bypasses RLS)
        console.log('Fetching call platform data for user ID:', userData.id);
        
        const response = await fetch(`/api/get_callplat_data?user_internal_id=${userData.id}`);
        const result = await response.json();

        console.log('Call platform API fetch result:', result);

        if (result.success) {
          console.log('Setting call platform data:', result.data);
          setCallPlatData(result.data || []);
        } else {
          console.error('Error fetching call platform data:', result.error);
          setError('Error fetching call platform data');
        }
      } catch (err) {
        console.error('Call platform fetch error:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCallPlatData();
  }, [user?.id, supabase]);

  // Function to refetch data after any modifications
  const refetchCallPlatData = async () => {
    console.log('Refetching call platform data...', { userId: user?.id, userInternalId });
    
    if (!user?.id || !userInternalId) {
      console.log('Missing user data for refetch');
      return;
    }

    try {
      const response = await fetch(`/api/get_callplat_data?user_internal_id=${userInternalId}`);
      const result = await response.json();

      console.log('Refetch call platform API result:', result);

      if (result.success) {
        console.log('Setting new call platform data:', result.data);
        setCallPlatData(result.data || []);
      } else {
        console.error('Error in call platform refetch:', result.error);
      }
    } catch (err) {
      console.error('Error refetching call platform data:', err);
    }
  };

  if (!user) {
    return (
      <div className="w-full p-4">
        <div className="text-center">
          <p>Please sign in to manage your call platforms.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full p-4">
        <div className="text-center">
          <p>Loading call platform data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Call Platform Management</h1>
        <p className="text-gray-600">
          Manage your call tracking platform accounts and phone numbers
        </p>
      </div>

      {/* Call Platform Table */}
      <CallPlatUITable 
        data={callPlatData} 
        userId={user.id}
        onDataChange={refetchCallPlatData}
      />
    </div>
  );
}