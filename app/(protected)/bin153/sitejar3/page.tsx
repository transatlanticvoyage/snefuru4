"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type SitesprenRow = {
  id: string;
  created_at: string;
  prenbase1: string;
  prenbase2: string;
  true_root_domain: string;
  full_subdomain: string;
  webproperty_type: string;
  fk_users_id: string;
  updated_at: string;
  wpuser1: string;
  wppass1: string;
  wp_plugin_installed1: boolean;
  wp_plugin_connected2: boolean;
};

export default function Sitejar3Page() {
  const searchParams = useSearchParams();
  const id = searchParams?.get('id');
  const [sitesprenData, setSitesprenData] = useState<SitesprenRow[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Set document title
    document.title = 'sitejar3 - Snefuru';

    // Fetch sitespren data for the logged-in user
    const fetchSitesprenData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('sitespren')
          .select('*')
          .eq('fk_users_id', user.id);

        if (error) {
          console.error('Error fetching sitespren data:', error);
        } else {
          setSitesprenData(data);
        }
      }
    };

    fetchSitesprenData();
  }, []);

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sitejar3 Details</h1>
              <p className="text-sm text-gray-500 mt-1">
                {id ? `Viewing details for ID: ${id}` : 'No ID provided'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area - Table */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">id</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">created_at</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">prenbase1</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">prenbase2</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">true_root_domain</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">full_subdomain</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">webproperty_type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">fk_users_id</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">updated_at</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">wpuser1</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">wppass1</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">wp_plugin_installed1</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">wp_plugin_connected2</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sitesprenData.map((row) => (
                <tr key={row.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.created_at}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.prenbase1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.prenbase2}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.true_root_domain}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.full_subdomain}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.webproperty_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.fk_users_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.updated_at}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.wpuser1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.wppass1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.wp_plugin_installed1 ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.wp_plugin_connected2 ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 