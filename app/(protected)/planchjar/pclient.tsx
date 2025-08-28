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
  const [activeTab, setActiveTab] = useState<'planchjartab' | 'dpackjartab'>('planchjartab');
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [filteredSites, setFilteredSites] = useState<SitesprenRecord[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userInternalId, setUserInternalId] = useState<string | null>(null);
  const [showNozzlePopup, setShowNozzlePopup] = useState(false);
  const [nozzleContent, setNozzleContent] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Generate sharkintax format output
  const generateSharkintaxOutput = async (dpackDatum: string, siteName: string) => {
    if (!userInternalId || !siteName) return;

    try {
      // Get sitespren data for the specified site
      const { data: siteData, error } = await supabase
        .from('sitespren')
        .select('*')
        .eq('fk_users_id', userInternalId)
        .eq('sitespren_base', siteName)
        .single();

      if (error || !siteData) {
        console.error('Error fetching site data:', error);
        return;
      }

      // Parse dpack_datum to get field list
      const fields = dpackDatum.split('\n').map(field => field.trim()).filter(field => field);
      
      let output = '';
      
      for (const field of fields) {
        // Check if this is a section header (doesn't start with 'driggs_' or 'sitespren_')
        const isSection = !field.startsWith('driggs_') && !field.startsWith('sitespren_') && field.includes('section');
        
        output += '===================================\n';
        output += field + '\n';
        output += '-----------------------------------\n';
        
        if (!isSection) {
          // Get the actual value from siteData
          const value = siteData[field as keyof typeof siteData] || '';
          output += value + '\n';
        } else {
          output += '\n'; // Empty line for sections
        }
      }
      
      setNozzleContent(output);
      setShowNozzlePopup(true);
    } catch (err) {
      console.error('Error generating sharkintax output:', err);
    }
  };

  // Generate walrustax format output
  const generateWalrustaxOutput = async (dpackDatum: string, siteName: string) => {
    if (!userInternalId || !siteName) return;

    try {
      // Get sitespren data for the specified site
      const { data: siteData, error } = await supabase
        .from('sitespren')
        .select('*')
        .eq('fk_users_id', userInternalId)
        .eq('sitespren_base', siteName)
        .single();

      if (error || !siteData) {
        console.error('Error fetching site data:', error);
        return;
      }

      // Parse dpack_datum to get field list
      const fields = dpackDatum.split('\n').map(field => field.trim()).filter(field => field);
      
      let output = '';
      
      for (const field of fields) {
        // Check if this is a section header
        const isSection = !field.startsWith('driggs_') && !field.startsWith('sitespren_') && field.includes('section');
        
        if (isSection) {
          output += field + '\n';
        } else {
          // Get the actual value from siteData
          const value = siteData[field as keyof typeof siteData] || '';
          output += field + '\t' + value + '\n';
        }
      }
      
      setNozzleContent(output);
      setShowNozzlePopup(true);
    } catch (err) {
      console.error('Error generating walrustax output:', err);
    }
  };

  // Copy content to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(nozzleContent);
      setCopySuccess(true);
      // Reset success message after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

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

  // Handle URL parameters on load
  useEffect(() => {
    const site = searchParams.get('site');
    const tab = searchParams.get('tab');
    
    // Set default tab if not present or invalid
    const validTab = (tab === 'planchjartab' || tab === 'dpackjartab') ? tab : 'planchjartab';
    setActiveTab(validTab);
    
    if (site) {
      setSelectedSite(site);
      setSearchText(site);
    }
    
    // Ensure URL always has the tab parameter
    const newParams = new URLSearchParams(searchParams.toString());
    if (!newParams.get('tab') || (newParams.get('tab') !== 'planchjartab' && newParams.get('tab') !== 'dpackjartab')) {
      newParams.set('tab', validTab);
      router.replace(`/planchjar?${newParams.toString()}`);
    }
  }, [searchParams, router]);

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
    // Update URL with both site and current tab
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('site', site);
    newParams.set('tab', activeTab);
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

  const handleTabChange = (newTab: 'planchjartab' | 'dpackjartab') => {
    setActiveTab(newTab);
    // Update URL with new tab parameter
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('tab', newTab);
    router.push(`/planchjar?${newParams.toString()}`);
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
              onClick={() => handleTabChange('planchjartab')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'planchjartab'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tab 1 - Planchjar
            </button>
            <button
              onClick={() => handleTabChange('dpackjartab')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'dpackjartab'
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
          
          {/* Nozzle Popup Button */}
          <div className="ml-4">
            <button
              onClick={() => setShowNozzlePopup(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded text-sm h-8 transition-colors"
            >
              nozzle popup
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'planchjartab' ? (
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
            <DriggsPacksTable 
              selectedSite={selectedSite}
              onSharkintaxClick={generateSharkintaxOutput}
              onWalrustaxClick={generateWalrustaxOutput}
            />
          </div>
        </div>
      )}
      
      {/* Nozzle Popup */}
      {showNozzlePopup && (
        <div className="fixed top-0 right-0 h-full w-[900px] z-50 bg-white shadow-xl flex flex-col">
          <div className="p-6 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">nozzle popup</h2>
              <button
                onClick={() => setShowNozzlePopup(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
          
          {/* Copy Button and Large Codebox Area */}
          <div className="flex-1 px-6 pb-6 flex flex-col">
            {/* Copy Button */}
            <div className="mb-3 flex justify-between items-center">
              <button
                onClick={copyToClipboard}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded text-sm transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy to Clipboard
              </button>
              {copySuccess && (
                <span className="text-green-600 text-sm font-medium">
                  Copied successfully!
                </span>
              )}
            </div>
            
            {/* Textarea */}
            <textarea
              value={nozzleContent}
              onChange={(e) => setNozzleContent(e.target.value)}
              className="flex-1 p-4 bg-gray-900 text-green-400 font-mono text-sm border border-gray-600 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter code here..."
              spellCheck="false"
            />
          </div>
        </div>
      )}
    </div>
  );
}