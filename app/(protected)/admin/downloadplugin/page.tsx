'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function DownloadPluginPage() {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingWithKey, setGeneratingWithKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    document.title = '/admin/downloadplugin - Snefuru';
  }, []);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user?.id) {
        router.push('/login');
        return;
      }

      try {
        // Check if user has is_admin = true
        const { data: userData, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('auth_id', user.id)
          .single();

        if (error || !userData) {
          console.error('Error checking admin status:', error);
          router.push('/');
          return;
        }

        if (userData.is_admin !== true) {
          // Not an admin, redirect to home
          router.push('/');
          return;
        }

        // User is admin, allow access
        setIsAuthorized(true);
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [user, supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Access denied. Admin privileges required.</p>
        </div>
      </div>
    );
  }

  const handleGenerateZip = async () => {
    setGenerating(true);
    setError(null);

    try {
      // Get current date in yyyymmdd format
      const date = new Date();
      const dateStr = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0');
      
      const filename = `SnefuruplinWPPlugin${dateStr}.zip`;

      // Call API endpoint to generate the zip
      const response = await fetch('/api/generate-plugin-zip');
      
      if (!response.ok) {
        throw new Error('Failed to generate plugin zip file');
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error generating zip:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateZipWithKey = async () => {
    setGeneratingWithKey(true);
    setError(null);

    try {
      // Get current date in yyyymmdd format
      const date = new Date();
      const dateStr = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0');
      
      const filename = `SnefuruplinWPPlugin-Configured-${dateStr}.zip`;

      // Call API endpoint to generate the zip with user's API key
      const response = await fetch('/api/generate-plugin-zip-with-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate plugin zip file with API key');
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error generating zip with key:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setGeneratingWithKey(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Snefuruplin</h1>
          <p className="mt-2 text-gray-600">
            WordPress Plugin Download Center
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Main content area */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              OPTION 1 - Download WordPress Plugin (no api key pre-loaded)
            </h2>
            <p className="text-gray-600 mb-4">
              Click the button below to generate and download the latest version of the Snefuruplin WordPress plugin.
            </p>
            
            <button
              onClick={handleGenerateZip}
              disabled={generating}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  generate snefuruplin wp plugin .zip download file
                </>
              )}
            </button>
          </div>

          {/* Option 2 Section */}
          <div className="mb-6 border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              OPTION 2 - Download Plugin With Your Specific API Key Pre-Loaded (users.ruplin_api_key_1)
            </h2>
            <p className="text-gray-600 mb-4">
              Download the plugin with your personal API key already configured. Simply install and it will work automatically.
            </p>
            
            <button
              onClick={handleGenerateZipWithKey}
              disabled={generatingWithKey}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingWithKey ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  generate plugin with my API key pre-loaded
                </>
              )}
            </button>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Plugin Information</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Plugin Name: Snefuruplin</li>
              <li>• Description: WordPress integration plugin for Snefuru platform</li>
              <li>• Version: Latest from repository</li>
              <li>• Compatibility: WordPress 5.0+</li>
            </ul>
          </div>

          <div className="border-t pt-6 mt-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Installation Instructions</h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Download the plugin zip file using the button above</li>
              <li>Log in to your WordPress admin panel</li>
              <li>Navigate to Plugins → Add New → Upload Plugin</li>
              <li>Choose the downloaded zip file and click "Install Now"</li>
              <li>Activate the plugin after installation</li>
              <li>Configure the plugin settings under the Snefuru menu</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}