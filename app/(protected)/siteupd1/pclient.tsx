'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import SpreadsheetGrid from './components/SpreadsheetGrid';

export default function Siteupd1Client() {
  const [loading, setLoading] = useState(false);
  const [userInternalId, setUserInternalId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [spreadsheetData, setSpreadsheetData] = useState<string[][]>([]);
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUserInternalId = async () => {
      if (!user?.id) return;

      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (userError || !userData) {
          console.error('User not found');
          return;
        }

        setUserInternalId(userData.id);
      } catch (err) {
        console.error('Error getting user ID:', err);
      }
    };

    getUserInternalId();
  }, [user?.id, supabase]);

  // f19_updatesites function
  const f19_updatesites = async () => {
    if (!userInternalId) {
      setNotification({
        type: 'error',
        message: 'User verification failed'
      });
      return;
    }

    // Filter out empty rows
    const validData = spreadsheetData.filter(row => 
      row[0] && row[0].trim() !== ''
    );

    if (validData.length === 0) {
      setNotification({
        type: 'error',
        message: 'Please enter at least one site in the spreadsheet'
      });
      return;
    }

    setLoading(true);
    setNotification(null);

    try {
      const response = await fetch('/api/f19_updatesites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sites_data: validData,
          user_internal_id: userInternalId
        }),
      });

      const result = await response.json();

      if (result.success) {
        setNotification({
          type: 'success',
          message: `Successfully processed ${result.data?.created || 0} new sites and updated ${result.data?.updated || 0} existing sites`
        });
        // Clear the spreadsheet
        setSpreadsheetData([]);
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to update sites'
        });
      }
    } catch (error) {
      console.error('Error updating sites:', error);
      setNotification({
        type: 'error',
        message: 'An error occurred while updating sites'
      });
    } finally {
      setLoading(false);
      // Clear notification after 8 seconds
      setTimeout(() => setNotification(null), 8000);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <p>Please sign in to manage site updates.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Bulk Site Updates</h1>
        <p className="text-gray-600">
          Update multiple sites and their host account associations
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

      {/* Instructions */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Instructions:</h3>
        <ul className="text-sm space-y-1">
          <li>• Paste your data into the spreadsheet below</li>
          <li>• Column A: Site base URL (e.g., dogs.com)</li>
          <li>• Column B: Host company name (e.g., porkbun.com)</li>
          <li>• Column C: Host account username (e.g., parkway)</li>
          <li>• The system will clean URLs and match with existing host accounts</li>
          <li>• New sites will be created, existing sites will be updated</li>
        </ul>
      </div>

      {/* Submit button */}
      <div className="mb-4">
        <button
          onClick={f19_updatesites}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors"
        >
          {loading ? 'Processing...' : 'f19_updatesites'}
        </button>
      </div>

      {/* Spreadsheet Grid */}
      <SpreadsheetGrid 
        data={spreadsheetData}
        onDataChange={setSpreadsheetData}
      />
    </div>
  );
}