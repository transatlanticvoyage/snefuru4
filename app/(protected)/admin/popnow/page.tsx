'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import KPopup1 from './components/KPopup1';

interface Sitespren {
  id: string;
  sitespren_base: string;
}

export default function PopNowPage() {
  const [sites, setSites] = useState<Sitespren[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  const currentSitebase = searchParams?.get('sitebase');

  useEffect(() => {
    document.title = '/admin/popnow - Snefuru';
  }, []);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) {
        router.push('/login');
        return;
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('auth_id', user.id)
        .single();

      if (error || !userData?.is_admin) {
        router.push('/');
        return;
      }
    };

    checkAdminStatus();
  }, [user, router, supabase]);

  // Fetch user's sites
  useEffect(() => {
    const fetchSites = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        // First get the internal user ID
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (!userData) {
          setError('User not found');
          setLoading(false);
          return;
        }

        // Fetch sites for this user
        const { data: sitesData, error: sitesError } = await supabase
          .from('sitespren')
          .select('id, sitespren_base')
          .eq('fk_users_id', userData.id)
          .order('sitespren_base', { ascending: true });

        if (sitesError) {
          console.error('Error fetching sites:', sitesError);
          setError('Error fetching sites');
        } else {
          setSites(sitesData || []);
          
          // Set selected site from URL if present
          if (currentSitebase && sitesData) {
            const matchingSite = sitesData.find(site => site.sitespren_base === currentSitebase);
            if (matchingSite) {
              setSelectedSite(currentSitebase);
            }
          }
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, [user?.id, supabase, currentSitebase]);

  // Handle site selection
  const handleSiteChange = (sitebase: string) => {
    setSelectedSite(sitebase);
    
    if (sitebase) {
      // Update URL with sitebase parameter
      const url = new URL(window.location.href);
      url.searchParams.set('sitebase', sitebase);
      router.push(`/admin/popnow?sitebase=${encodeURIComponent(sitebase)}`);
    } else {
      // Remove sitebase parameter if no site selected
      router.push('/admin/popnow');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Popup Development</h1>
      <p className="text-sm text-gray-600 mb-6">
        Test and develop the KPopup1 template system
      </p>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="space-y-6">
        {/* Functions Popup Button */}
        <div>
          <button
            onClick={() => setIsPopupOpen(true)}
            className="font-bold text-white rounded"
            style={{
              backgroundColor: '#800000', // maroon color
              fontSize: '20px',
              paddingLeft: '14px',
              paddingRight: '14px',
              paddingTop: '10px',
              paddingBottom: '10px'
            }}
          >
            functions popup
          </button>
        </div>

        {/* Site Selector */}
        <div className="max-w-md">
          <label htmlFor="site-selector" className="block text-sm font-medium text-gray-700 mb-2">
            Select a Site
          </label>
          <select
            id="site-selector"
            value={selectedSite}
            onChange={(e) => handleSiteChange(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">-- Select a site --</option>
            {sites.map((site) => (
              <option key={site.id} value={site.sitespren_base}>
                {site.sitespren_base}
              </option>
            ))}
          </select>
          
          {currentSitebase && (
            <p className="mt-2 text-sm text-gray-600">
              Current selection: <span className="font-medium">{currentSitebase}</span>
            </p>
          )}
        </div>

        {/* Development Notes */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">KPopup1 Template System</h3>
          <div className="text-sm text-blue-700">
            <p className="mb-2">This page is for developing and testing the KPopup1 template system.</p>
            <p className="mb-2">Files related to this popup:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code>/app/(protected)/admin/popnow/components/KPopup1.tsx</code> - Main popup component</li>
              <li><code>/app/(protected)/admin/popnow/components/KPopup1Provider.tsx</code> - State management wrapper</li>
              <li><code>/app/(protected)/admin/popnow/components/KPopup1Config.ts</code> - Configuration types and defaults</li>
              <li><code>/app/(protected)/admin/popnow/components/hooks/useKPopup1.ts</code> - Custom hooks</li>
            </ul>
          </div>
        </div>
      </div>

      {/* KPopup1 Component */}
      <KPopup1 
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        sitebase={currentSitebase}
      />
    </div>
  );
}