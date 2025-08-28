'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import MenjariButtonBarFileGunLinks from '@/app/components/MenjariButtonBarFileGunLinks';
import PlanchjarTable from './components/PlanchjarTable';
import DriggsPacksTable from '../dpackjar/components/DriggsPacksTable';

interface SitesprenRecord {
  id: string;
  sitespren_base: string;
}

export default function PlanchjarClient() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  const [activeTab, setActiveTab] = useState<'planchjar' | 'dpackjar'>('planchjar');
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [filteredSites, setFilteredSites] = useState<SitesprenRecord[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userInternalId, setUserInternalId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get internal user ID from users table
  useEffect(() => {
    const getInternalUserId = async () => {
      if (!user?.id) return;

      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (!error && userData) {
          setUserInternalId(userData.id);
        }
      } catch (err) {
        console.error('Error getting internal user ID:', err);
      }
    };

    if (user?.id) {
      getInternalUserId();
    }
  }, [user, supabase]);

  // Handle URL parameter on load
  useEffect(() => {
    const site = searchParams.get('site');
    if (site) {
      setSelectedSite(site);
      setSearchText(site);
    }
  }, [searchParams]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // Search for sites when user types
  useEffect(() => {
    const searchSites = async () => {
      if (!userInternalId || !searchText || searchText === selectedSite) {
        setFilteredSites([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('sitespren')
          .select('id, sitespren_base')
          .eq('fk_users_id', userInternalId)
          .ilike('sitespren_base', `%${searchText}%`)
          .limit(10);

        if (!error && data) {
          setFilteredSites(data);
          setShowDropdown(data.length > 0);
        }
      } catch (err) {
        console.error('Error searching sites:', err);
      }
    };

    const debounceTimer = setTimeout(searchSites, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchText, userInternalId, selectedSite, supabase]);

  const handleSiteSelect = (site: string) => {
    setSelectedSite(site);
    setSearchText(site);
    setShowDropdown(false);
    // Update URL
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('site', site);
    router.push(`/planchjar?${newParams.toString()}`);
  };

  const handleSubmit = () => {
    if (searchText && searchText !== selectedSite) {
      handleSiteSelect(searchText);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    if (value !== selectedSite) {
      setSelectedSite('');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Tabs - Full Width */}
      <div className="bg-white border-b">
        <div className="flex items-center">
          <div className="flex">
            <button
              onClick={() => setActiveTab('planchjar')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'planchjar'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tab 1 - Planchjar
            </button>
            <button
              onClick={() => setActiveTab('dpackjar')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'dpackjar'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tab 2 - Dpackjar
            </button>
          </div>
          
          {/* Site Search Section - positioned 20px from Tab 2 */}
          <div className="flex items-center ml-5 relative" ref={dropdownRef}>
            <button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-1 rounded-l-md text-sm h-8 transition-colors"
            >
              Submit
            </button>
            <div className="relative">
              <input
                type="text"
                value={searchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search domain..."
                className={`w-[400px] h-8 px-3 text-sm border rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  selectedSite 
                    ? 'bg-navy-900 text-white border-navy-900' 
                    : 'bg-white text-gray-900 border-gray-300'
                }`}
                style={selectedSite ? { backgroundColor: '#1e3a8a', color: 'white' } : {}}
              />
              
              {/* Dropdown for filtered results */}
              {showDropdown && filteredSites.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-auto">
                  {filteredSites.map((site) => (
                    <button
                      key={site.id}
                      onClick={() => handleSiteSelect(site.sitespren_base)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      {site.sitespren_base}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'planchjar' ? (
        <div className="flex flex-col flex-1">
          {/* Menjari Button Bar */}
          <div className="px-6 pb-0">
            <MenjariButtonBarFileGunLinks />
          </div>
          
          {/* Header */}
          <div className="bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">📋 Planches</h1>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Project: Tregnar</div>
              </div>
            </div>
          </div>

          {/* Main Content - Full Width PlanchjarTable */}
          <div className="flex-1 overflow-hidden">
            <PlanchjarTable />
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1">
          {/* Dpackjar Content */}
          <div className="flex-1 overflow-hidden">
            <DriggsPacksTable />
          </div>
        </div>
      )}
    </div>
  );
}