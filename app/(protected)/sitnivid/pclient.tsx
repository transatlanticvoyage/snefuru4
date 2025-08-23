'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import SitesprenEditor from './components/SitesprenEditor';
import Link from 'next/link';

interface SitesprenRecord {
  id: string;
  created_at: string;
  sitespren_base: string | null;
  true_root_domain: string | null;
  full_subdomain: string | null;
  webproperty_type: string | null;
  fk_users_id: string;
  updated_at: string | null;
  wpuser1: string | null;
  wppass1: string | null;
  wp_plugin_installed1: boolean | null;
  wp_plugin_connected2: boolean | null;
  fk_domreg_hostaccount: string | null;
  is_wp_site: boolean | null;
}

interface HostAccountOption {
  id: string;
  username: string | null;
  host_company: {
    name: string | null;
  } | null;
}

export default function SitnividClient() {
  const [sitesprenRecord, setSitesprenRecord] = useState<SitesprenRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInternalId, setUserInternalId] = useState<string | null>(null);
  const [hostAccountOptions, setHostAccountOptions] = useState<HostAccountOption[]>([]);
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const site = searchParams?.get('site') || null;

  useEffect(() => {
    const fetchSitesprenRecord = async () => {
      if (!user?.id || !site) {
        setLoading(false);
        if (!site) {
          setError('No site parameter provided');
        }
        return;
      }

      try {
        // First get the internal user ID
        const userResponse = await fetch(`/api/get_user_internal_id?auth_id=${user.id}`);
        const userResult = await userResponse.json();

        if (!userResult.success || !userResult.data?.internal_id) {
          setError('User not found');
          setLoading(false);
          return;
        }

        setUserInternalId(userResult.data.internal_id);

        // Fetch host account options for dropdown
        const hostAccountResponse = await fetch(`/api/get_hostaccount_data_v2?user_internal_id=${userResult.data.internal_id}`);
        const hostAccountResult = await hostAccountResponse.json();
        
        if (hostAccountResult.success) {
          setHostAccountOptions(hostAccountResult.data || []);
        }

        // Fetch the specific sitespren record for this user and site
        const response = await fetch(`/api/get_sitespren_record?site=${encodeURIComponent(site)}&user_internal_id=${userResult.data.internal_id}`);
        const result = await response.json();

        if (result.success && result.data) {
          setSitesprenRecord(result.data);
        } else {
          setError(result.error || 'Site record not found or access denied');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred while loading the site data');
      } finally {
        setLoading(false);
      }
    };

    fetchSitesprenRecord();
  }, [user?.id, site]);

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <p>Please sign in to edit site details.</p>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Invalid Request</h1>
          <p className="mb-4">No site parameter provided.</p>
          <Link 
            href="/sitejar4"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Sites
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <p>Loading site details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
          <p className="mb-4 text-red-600">{error}</p>
          <Link 
            href="/sitejar4"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Sites
          </Link>
        </div>
      </div>
    );
  }

  if (!sitesprenRecord) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Not Found</h1>
          <p className="mb-4">Site record not found or you don't have access to it.</p>
          <Link 
            href="/sitejar4"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Sites
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Edit Site: {sitesprenRecord.sitespren_base}</h1>
          <Link 
            href="/sitejar4"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            ← Back to Sites
          </Link>
        </div>
        <div className="text-sm text-gray-600">
          <p><strong>Site ID:</strong> {sitesprenRecord.id}</p>
          <p><strong>Created:</strong> {new Date(sitesprenRecord.created_at).toLocaleString()}</p>
          <p><strong>Updated:</strong> {sitesprenRecord.updated_at ? new Date(sitesprenRecord.updated_at).toLocaleString() : 'Never'}</p>
        </div>
      </div>

      {/* Editor */}
      <SitesprenEditor 
        sitesprenRecord={sitesprenRecord}
        userInternalId={userInternalId!}
        hostAccountOptions={hostAccountOptions}
        onUpdate={(updatedRecord) => setSitesprenRecord(updatedRecord)}
      />
    </div>
  );
}