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
        {/* New Interface Elements */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">add new sites</h2>
          <textarea
            className="w-[340px] h-[250px] border border-gray-300 rounded-md p-2 mb-4"
            placeholder="Enter site details here..."
          />
          <button
            className="w-[340px] bg-navy-500 text-white font-bold py-2 px-4 rounded-md"
            style={{ backgroundColor: '#001f3f' }}
          >
            func_47_addsites
          </button>
        </div>

        {/* Main Content Area - Table */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 overflow-x-auto">
          <style jsx>{`
            th {
              text-transform: none;
            }
          `}</style>
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