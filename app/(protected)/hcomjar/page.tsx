'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import HostCompanyUITable from './components/HostCompanyUITable';

export default function HcomjarPage() {
  const [hostCompanyData, setHostCompanyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInternalId, setUserInternalId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    document.title = 'hcomjar - Snefuru';
  }, []);

  useEffect(() => {
    const fetchHostCompanyData = async () => {
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

        // Fetch user's host company data via API (bypasses RLS)
        console.log('Fetching host company data for user ID:', userData.id);
        
        const response = await fetch(`/api/get_hostcompany_data?user_internal_id=${userData.id}`);
        const result = await response.json();

        console.log('API fetch result:', result);

        if (result.success) {
          console.log('Setting host company data:', result.data);
          setHostCompanyData(result.data || []);
        } else {
          console.error('Error fetching host company:', result.error);
          setError('Error fetching host company data');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchHostCompanyData();
  }, [user?.id, supabase]);

  // Function to refetch data after any modifications
  const refetchHostCompanyData = async () => {
    console.log('Refetching data...', { userId: user?.id, userInternalId });
    
    if (!user?.id || !userInternalId) {
      console.log('Missing user data for refetch');
      return;
    }

    try {
      const response = await fetch(`/api/get_hostcompany_data?user_internal_id=${userInternalId}`);
      const result = await response.json();

      console.log('Refetch API result:', result);

      if (result.success) {
        console.log('Setting new data:', result.data);
        setHostCompanyData(result.data || []);
      } else {
        console.error('Error in refetch:', result.error);
      }
    } catch (err) {
      console.error('Error refetching data:', err);
    }
  };

  // f18_createhostcompany function
  const f18_createhostcompany = async () => {
    if (!userInternalId) {
      setNotification({
        type: 'error',
        message: 'User verification failed'
      });
      return;
    }

    setIsCreating(true);
    setNotification(null);

    try {
      const response = await fetch('/api/f18_createhostcompany', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_internal_id: userInternalId
        }),
      });

      const result = await response.json();

      if (result.success) {
        setNotification({
          type: 'success',
          message: 'Successfully created new host company record'
        });
        await refetchHostCompanyData(); // Refresh the table
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to create host company'
        });
      }
    } catch (error) {
      console.error('Error creating host company:', error);
      setNotification({
        type: 'error',
        message: 'An error occurred while creating host company'
      });
    } finally {
      setIsCreating(false);
      // Clear notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <p>Please sign in to manage your host companies.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <p>Loading host company data...</p>
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
        <h1 className="text-3xl font-bold mb-2">Host Company Management</h1>
        <p className="text-gray-600">
          Manage your hosting provider companies
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded-md ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Create button */}
      <div className="mb-6">
        <button
          onClick={f18_createhostcompany}
          disabled={isCreating}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors"
        >
          {isCreating ? 'Creating...' : 'f18_createhostcompany'}
        </button>
      </div>

      {/* Host Company Table */}
      <HostCompanyUITable 
        data={hostCompanyData} 
        userId={user.id}
        onDataChange={refetchHostCompanyData}
      />
    </div>
  );
}