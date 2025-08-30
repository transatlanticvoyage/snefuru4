'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface City {
  city_id: number;
  city_name: string;
  state_code?: string;
  country_code?: string;
}

interface Industry {
  industry_id: number;
  industry_name: string;
  industry_category?: string;
}

interface Cncglub {
  cncg_id: number;
  cncg_name: string;
  cncg_description?: string;
}

export default function AssignwizClient() {
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  const [type, setType] = useState<string>('');
  const [site, setSite] = useState<string>('');
  const [user, setUser] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Data states
  const [cities, setCities] = useState<City[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [cncglubs, setCncglubs] = useState<Cncglub[]>([]);
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<any[]>([]);
  
  // UI states
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Selection chambers state
  const [showCncglubChamber, setShowCncglubChamber] = useState(false);
  const [showCityChamber, setShowCityChamber] = useState(false);
  const [showIndustryChamber, setShowIndustryChamber] = useState(false);
  
  // Search terms for each chamber
  const [cncglubSearchTerm, setCncglubSearchTerm] = useState('');
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [industrySearchTerm, setIndustrySearchTerm] = useState('');
  
  // Selected values for each relationship
  const [selectedCncglubId, setSelectedCncglubId] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [selectedIndustryId, setSelectedIndustryId] = useState<number | null>(null);

  // Raw text values for each relationship (when user types instead of selecting)
  const [rawCncglubText, setRawCncglubText] = useState<string>('');
  const [rawCityText, setRawCityText] = useState<string>('');
  const [rawIndustryText, setRawIndustryText] = useState<string>('');

  // Auto-discovery state for cncglub matches
  const [autoDiscoveredCncglub, setAutoDiscoveredCncglub] = useState<Cncglub | null>(null);

  useEffect(() => {
    // Extract URL parameters - tractor_name is the leftmost parameter
    const tractorNameParam = searchParams?.get('tractor_name') || '';
    const typeParam = searchParams?.get('type') || '';
    const siteParam = searchParams?.get('site') || '';
    const userParam = searchParams?.get('user') || '';
    
    setType(typeParam);
    setSite(siteParam);
    setUser(userParam);
    
    // tractor_name is required and must be present
    if (!tractorNameParam) {
      setError('Missing required parameter: tractor_name');
      setLoading(false);
      return;
    }
    
    // For site_to_cnc_tractor, we only need tractor_name and site
    if (tractorNameParam === 'site_to_cnc_tractor') {
      if (siteParam) {
        setLoading(false);
      } else {
        setError('Missing required parameter for site_to_cnc_tractor: site');
        setLoading(false);
      }
    }
    // For tractor_name=all, we only need site parameter
    else if (tractorNameParam === 'all') {
      if (siteParam) {
        setLoading(false);
      } else {
        setError('Missing required parameter: site');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = getCurrentData().filter(item => 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.city_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.industry_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.cncg_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(getCurrentData());
    }
  }, [searchTerm, cities, industries, cncglubs]);

  // Load all data when tractorName is 'all'
  useEffect(() => {
    const tractorName = searchParams?.get('tractor_name');
    if (tractorName === 'all') {
      const loadAllData = async () => {
        try {
          await loadCities();
          await loadIndustries();
          await loadCncglubs();
        } catch (err) {
          setError(`Failed to load data: ${err instanceof Error ? err.message : String(err)}`);
        }
      };
      loadAllData();
    }
  }, [searchParams]);

  // Load existing site data when site parameter is available
  useEffect(() => {
    const tractorName = searchParams?.get('tractor_name');
    const siteParam = searchParams?.get('site');
    
    if (tractorName === 'all' && siteParam) {
      const loadSiteData = async () => {
        try {
          const { data, error } = await supabase
            .from('sitespren')
            .select('rel_cncglub_id, rel_city_id, rel_industry_id, driggs_city, driggs_industry, driggs_category')
            .eq('sitespren_base', siteParam)
            .single();

          if (error) {
            // Site not found or no data - this is OK, just use empty values
            return;
          }

          // Populate the ID fields with existing values
          if (data.rel_cncglub_id) setSelectedCncglubId(data.rel_cncglub_id);
          if (data.rel_city_id) setSelectedCityId(data.rel_city_id);
          if (data.rel_industry_id) setSelectedIndustryId(data.rel_industry_id);

          // Populate raw text fields with existing text values
          if (data.driggs_city) setRawCityText(data.driggs_city);
          if (data.driggs_industry) setRawIndustryText(data.driggs_industry);
          if (data.driggs_category) setRawCncglubText(data.driggs_category);

        } catch (err) {
          // If there's an error loading site data, just continue with empty values
          console.error('Error loading site data:', err);
        }
      };
      loadSiteData();
    }
  }, [searchParams, site]);

  // Auto-discovery trigger: run when both city and industry have values
  useEffect(() => {
    if (selectedCityId && selectedIndustryId) {
      autoDiscoverCncglub(selectedCityId, selectedIndustryId);
    }
  }, [selectedCityId, selectedIndustryId]);

  const loadData = async (dataType: string) => {
    try {
      setLoading(true);
      
      switch (dataType) {
        case 'city':
          await loadCities();
          break;
        case 'industry':
          await loadIndustries();
          break;
        case 'cncglub':
          await loadCncglubs();
          break;
        default:
          setError(`Unknown type: ${dataType}`);
      }
    } catch (err) {
      setError(`Failed to load data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async () => {
    const { data, error } = await supabase
      .from('cities')
      .select('city_id, city_name, state_code, country')
      .order('city_name');
    
    if (error) throw error;
    setCities(data || []);
    setFilteredData(data || []);
  };

  const loadIndustries = async () => {
    const { data, error } = await supabase
      .from('industries')
      .select('industry_id, industry_name, industry_description')
      .order('industry_name');
    
    if (error) throw error;
    setIndustries(data || []);
    setFilteredData(data || []);
  };

  const loadCncglubs = async () => {
    const { data, error } = await supabase
      .from('cncglub')
      .select(`
        cncg_id, 
        rel_city_id, 
        rel_industry_id,
        cities:rel_city_id(city_name, state_code),
        industries:rel_industry_id(industry_name)
      `)
      .order('cncg_id');
    
    if (error) throw error;
    setCncglubs(data || []);
    setFilteredData(data || []);
  };

  // Auto-discovery function to find cncglub matches based on city and industry
  const autoDiscoverCncglub = async (cityId: number | null, industryId: number | null) => {
    if (!cityId || !industryId) {
      setAutoDiscoveredCncglub(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cncglub')
        .select(`
          cncg_id, 
          rel_city_id, 
          rel_industry_id,
          cities:rel_city_id(city_name, state_code),
          industries:rel_industry_id(industry_name)
        `)
        .eq('rel_city_id', cityId)
        .eq('rel_industry_id', industryId)
        .limit(1)
        .single();

      if (error) {
        // No match found, clear auto-discovery
        setAutoDiscoveredCncglub(null);
        return;
      }

      setAutoDiscoveredCncglub(data);
    } catch (err) {
      setAutoDiscoveredCncglub(null);
    }
  };

  const getCurrentData = () => {
    switch (type) {
      case 'city': return cities;
      case 'industry': return industries;
      case 'cncglub': return cncglubs;
      default: return [];
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'city': return 'City';
      case 'industry': return 'Industry';
      case 'cncglub': return 'City-Niche Combination';
      default: return 'Unknown';
    }
  };

  const getFieldName = () => {
    switch (type) {
      case 'city': return 'rel_city_id';
      case 'industry': return 'rel_industry_id';
      case 'cncglub': return 'rel_cncglub_id';
      default: return 'unknown';
    }
  };

  const handleSelection = (id: number) => {
    setSelectedValue(id);
    setShowConfirmation(true);
  };

  const handleConfirmation = async () => {
    if (!selectedValue || !site || !user) {
      setFeedback({ type: 'error', message: 'Missing required data for assignment' });
      return;
    }

    try {
      // Update the sitespren table with the selected value
      const { error } = await supabase
        .from('sitespren')
        .update({ [getFieldName()]: selectedValue })
        .eq('sitespren_base', site);

      if (error) throw error;

      setFeedback({ 
        type: 'success', 
        message: `Successfully assigned ${getTypeLabel()} ID ${selectedValue} to site ${site}` 
      });
      
      // Close confirmation after 3 seconds
      setTimeout(() => {
        setShowConfirmation(false);
        setSelectedValue(null);
      }, 3000);

    } catch (err) {
      setFeedback({ 
        type: 'error', 
        message: `Failed to assign value: ${err}` 
      });
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedValue(null);
  };

  const handleSaveRelationships = async () => {
    try {
      // Prepare the update data with both selected IDs and raw text fields
      const updateData: { [key: string]: number | string | null } = {};
      
      // Handle relationship IDs (from dropdown selections)
      if (selectedCityId) updateData.rel_city_id = selectedCityId;
      if (selectedIndustryId) updateData.rel_industry_id = selectedIndustryId;
      if (selectedCncglubId) updateData.rel_cncglub_id = selectedCncglubId;

      // Handle raw text values (from direct text input)
      if (rawCityText.trim()) updateData.driggs_city = rawCityText.trim();
      if (rawIndustryText.trim()) updateData.driggs_industry = rawIndustryText.trim();
      if (rawCncglubText.trim()) updateData.driggs_category = rawCncglubText.trim();

      // Allow saving even with no selections (will clear existing assignments)
      if (Object.keys(updateData).length === 0) {
        setFeedback({ type: 'success', message: 'No changes to save - all assignments cleared' });
        return;
      }

      // If site parameter is available, update that specific site
      if (site) {
        const { error } = await supabase
          .from('sitespren')
          .update(updateData)
          .eq('sitespren_base', site);

        if (error) throw error;

        const savedFields = Object.keys(updateData).join(', ');
        setFeedback({ 
          type: 'success', 
          message: `Successfully saved assignments (${savedFields}) for site ${site}` 
        });
      } else {
        // If no specific site, just show what would be saved
        const savedFields = Object.keys(updateData).join(', ');
        setFeedback({ 
          type: 'success', 
          message: `Assignment selections ready to save: ${savedFields}` 
        });
      }

    } catch (err) {
      setFeedback({ 
        type: 'error', 
        message: `Failed to save assignments: ${err}` 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assignment wizard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  // Get tractor name from URL parameters
  const tractorName = searchParams?.get('tractor_name') || '';

  // Render site_to_cnc_tractor chamber interface
  if (tractorName === 'site_to_cnc_tractor') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Assignment Wizard - Site to CNC Tractor</h1>
            <div className="text-sm text-gray-600 mt-1">
              Site assignment interface for CNC tractor operations
            </div>
          </div>
        </div>

        {/* site_to_cnc_tractor Chamber */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-gray-900 mb-4" style={{ fontWeight: 'bold', fontSize: '16px' }}>
              site_to_cnc_tractor
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Parameter:
              </label>
              <input
                type="text"
                value={site}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none"
                placeholder="Site parameter will appear here"
              />
            </div>
            <div className="text-sm text-gray-500">
              This interface is specifically designed for site-to-CNC tractor operations. The site parameter is automatically populated from the URL.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render all tractor interfaces when tractor_name is "all"
  if (tractorName === 'all') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Assignment Wizard - All Tractor Interfaces</h1>
            <div className="text-sm text-gray-600 mt-1">
              Complete assignment interface showing all available tractor operations
            </div>
          </div>
        </div>

        {/* All Tractor Interfaces */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* site_to_cnc_tractor Chamber */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-gray-900" style={{ fontWeight: 'bold', fontSize: '16px' }}>
                site_to_cnc_tractor
              </h2>
              <button
                onClick={handleSaveRelationships}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Save Assignments
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Parameter:
              </label>
              <input
                type="text"
                value={site}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none"
                placeholder="Site parameter will appear here"
              />
            </div>
          </div>

          {/* Original Assignment Interface */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {type ? `${getTypeLabel()} Assignment` : 'Assignment Interface'}
              </h2>
              {site && (
                <div className="text-sm text-gray-600 mt-1">
                  Assigning {type ? getTypeLabel() : 'data'} for site: <span className="font-medium">{site}</span>
                </div>
              )}
            </div>
            
            {type && (
              <>
                {/* Search */}
                <div className="px-6 py-4">
                  <input
                    type="text"
                    placeholder={`Search ${getTypeLabel().toLowerCase()}s...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Data List */}
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {filteredData.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500">
                      No {getTypeLabel().toLowerCase()}s found
                    </div>
                  ) : (
                    filteredData.map((item) => {
                      const id = item.city_id || item.industry_id || item.cncg_id;
                      const name = item.city_name || item.industry_name || item.cncg_name;
                      const description = item.state_code || item.industry_category || item.cncg_description;
                      
                      return (
                        <div 
                          key={id}
                          className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleSelection(id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{name}</div>
                              {description && (
                                <div className="text-sm text-gray-500">{description}</div>
                              )}
                            </div>
                            <div className="text-sm text-gray-400">ID: {id}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {/* New Assignment Interface - Three Selection Areas */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Relationship Assignments</h3>
            <div className="space-y-4">
              
              {/* sitespren.rel_cncglub_id Assignment */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-700">sitespren.rel_cncglub_id</h4>
                  <span className="text-sm text-gray-500">ID</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={selectedCncglubId || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numericValue = value ? parseInt(value) : null;
                      setSelectedCncglubId(numericValue);
                      setRawCncglubText(''); // Clear raw text when ID is manually entered
                    }}
                    placeholder="No CNCGLUB assigned - type ID or select from table"
                    className="px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white flex-1"
                  />
                  <a
                    href="/assignwiz"
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200 text-sm transition-colors duration-150"
                  >
                    /assignwiz
                  </a>
                  <button
                    onClick={() => setShowCncglubChamber(!showCncglubChamber)}
                    className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold border border-yellow-400 text-sm transition-colors duration-150"
                  >
                    select from search table
                  </button>
                  <button
                    onClick={() => {
                      if (autoDiscoveredCncglub) {
                        setSelectedCncglubId(autoDiscoveredCncglub.cncg_id);
                      }
                    }}
                    disabled={!autoDiscoveredCncglub}
                    className={`px-3 py-2 text-sm transition-colors duration-150 ${
                      autoDiscoveredCncglub 
                        ? 'bg-green-400 hover:bg-green-500 text-black font-bold border border-green-400' 
                        : 'bg-gray-200 text-gray-500 border border-gray-300 cursor-not-allowed'
                    }`}
                  >
                    insert the auto-discovered match
                  </button>
                  <input
                    type="text"
                    value={autoDiscoveredCncglub ? `ID: ${autoDiscoveredCncglub.cncg_id} - ${autoDiscoveredCncglub.cities?.city_name}, ${autoDiscoveredCncglub.cities?.state_code} - ${autoDiscoveredCncglub.industries?.industry_name}` : 'No auto-discovery available'}
                    readOnly
                    placeholder="Auto-discovered match will appear here"
                    className="px-3 py-2 border border-gray-300 rounded-r-md text-sm focus:outline-none bg-gray-100 text-gray-600 min-w-[300px]"
                  />
                </div>
              </div>

              {/* sitespren.rel_city_id Assignment */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-700">sitespren.rel_city_id</h4>
                  <span className="text-sm text-gray-500">ID</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={selectedCityId || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numericValue = value ? parseInt(value) : null;
                      setSelectedCityId(numericValue);
                      setRawCityText(''); // Clear raw text when ID is manually entered
                    }}
                    placeholder="No City assigned - type ID or select from table"
                    className="px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white flex-1"
                  />
                  <a
                    href="/assignwiz"
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200 text-sm transition-colors duration-150"
                  >
                    /assignwiz
                  </a>
                  <button
                    onClick={() => setShowCityChamber(!showCityChamber)}
                    className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold border border-yellow-400 rounded-r-md text-sm transition-colors duration-150"
                  >
                    select
                  </button>
                </div>
              </div>

              {/* sitespren.rel_industry_id Assignment */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-700">sitespren.rel_industry_id</h4>
                  <span className="text-sm text-gray-500">ID</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={selectedIndustryId || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numericValue = value ? parseInt(value) : null;
                      setSelectedIndustryId(numericValue);
                      setRawIndustryText(''); // Clear raw text when ID is manually entered
                    }}
                    placeholder="No Industry assigned - type ID or select from table"
                    className="px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white flex-1"
                  />
                  <a
                    href="/assignwiz"
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200 text-sm transition-colors duration-150"
                  >
                    /assignwiz
                  </a>
                  <button
                    onClick={() => setShowIndustryChamber(!showIndustryChamber)}
                    className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold border border-yellow-400 rounded-r-md text-sm transition-colors duration-150"
                  >
                    select
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Selection Chambers */}
          
          {/* CNCGLUB Selection Chamber */}
          {showCncglubChamber && (
            <div className="mt-6 border border-gray-300 rounded-lg bg-white p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Select CNCGLUB</h4>
              
              {/* Search Box with Raw Text Entry */}
              <div className="mb-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search CNCGLUB records or enter custom text:
                  </label>
                  <input
                    type="text"
                    placeholder="Search CNCGLUB records or type custom category..."
                    value={cncglubSearchTerm}
                    onChange={(e) => {
                      setCncglubSearchTerm(e.target.value);
                      setRawCncglubText(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {rawCncglubText && (
                  <div className="text-sm text-blue-600">
                    💡 Custom text: "{rawCncglubText}" will be saved if you don't select from table below
                  </div>
                )}
              </div>

              {/* CNCGLUB Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Info</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cncglubs
                      .filter(item => 
                        !cncglubSearchTerm || 
                        item.cncg_id.toString().includes(cncglubSearchTerm.toLowerCase()) ||
                        (item.rel_city_id && item.rel_city_id.toString().includes(cncglubSearchTerm.toLowerCase()))
                      )
                      .slice(0, 10)
                      .map((item) => (
                        <tr key={item.cncg_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.cncg_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            City ID: {item.rel_city_id || 'N/A'}, Industry ID: {item.rel_industry_id || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => {
                                setSelectedCncglubId(item.cncg_id);
                                setRawCncglubText(''); // Clear raw text when dropdown selection is made
                                setShowCncglubChamber(false);
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* City Selection Chamber */}
          {showCityChamber && (
            <div className="mt-6 border border-gray-300 rounded-lg bg-white p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Select City</h4>
              
              {/* Search Box with Raw Text Entry */}
              <div className="mb-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search cities or enter custom city:
                  </label>
                  <input
                    type="text"
                    placeholder="Search cities or type custom city name..."
                    value={citySearchTerm}
                    onChange={(e) => {
                      setCitySearchTerm(e.target.value);
                      setRawCityText(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {rawCityText && (
                  <div className="text-sm text-blue-600">
                    💡 Custom text: "{rawCityText}" will be saved if you don't select from table below
                  </div>
                )}
              </div>

              {/* Cities Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cities
                      .filter(item => 
                        !citySearchTerm || 
                        item.city_name.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
                        (item.state_full && item.state_full.toLowerCase().includes(citySearchTerm.toLowerCase())) ||
                        item.city_id.toString().includes(citySearchTerm.toLowerCase())
                      )
                      .slice(0, 10)
                      .map((item) => (
                        <tr key={item.city_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.city_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.city_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.state_code || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => {
                                setSelectedCityId(item.city_id);
                                setRawCityText(''); // Clear raw text when dropdown selection is made
                                setShowCityChamber(false);
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Industry Selection Chamber */}
          {showIndustryChamber && (
            <div className="mt-6 border border-gray-300 rounded-lg bg-white p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Select Industry</h4>
              
              {/* Search Box with Raw Text Entry */}
              <div className="mb-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search industries or enter custom industry:
                  </label>
                  <input
                    type="text"
                    placeholder="Search industries or type custom industry name..."
                    value={industrySearchTerm}
                    onChange={(e) => {
                      setIndustrySearchTerm(e.target.value);
                      setRawIndustryText(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {rawIndustryText && (
                  <div className="text-sm text-blue-600">
                    💡 Custom text: "{rawIndustryText}" will be saved if you don't select from table below
                  </div>
                )}
              </div>

              {/* Industries Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {industries
                      .filter(item => 
                        !industrySearchTerm || 
                        item.industry_name.toLowerCase().includes(industrySearchTerm.toLowerCase()) ||
                        item.industry_id.toString().includes(industrySearchTerm.toLowerCase())
                      )
                      .slice(0, 10)
                      .map((item) => (
                        <tr key={item.industry_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.industry_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.industry_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => {
                                setSelectedIndustryId(item.industry_id);
                                setRawIndustryText(''); // Clear raw text when dropdown selection is made
                                setShowIndustryChamber(false);
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div className={`mt-6 p-4 rounded-lg ${
              feedback.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {feedback.message}
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirm Assignment
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to assign {getTypeLabel()} ID <span className="font-medium">{selectedValue}</span> to site <span className="font-medium">{site}</span>?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmation}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default render for specific tractor types (legacy behavior)
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Assignment Wizard</h1>
          <div className="text-sm text-gray-600 mt-1">
            Assigning {getTypeLabel()} for site: <span className="font-medium">{site}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder={`Search ${getTypeLabel().toLowerCase()}s...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Data List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Available {getTypeLabel()}s ({filteredData.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {filteredData.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No {getTypeLabel().toLowerCase()}s found
              </div>
            ) : (
              filteredData.map((item) => {
                const id = item.city_id || item.industry_id || item.cncg_id;
                const name = item.city_name || item.industry_name || item.cncg_name;
                const description = item.state_code || item.industry_category || item.cncg_description;
                
                return (
                  <div 
                    key={id}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleSelection(id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{name}</div>
                        {description && (
                          <div className="text-sm text-gray-500">{description}</div>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">ID: {id}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`mt-6 p-4 rounded-lg ${
            feedback.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {feedback.message}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Assignment
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to assign {getTypeLabel()} ID <span className="font-medium">{selectedValue}</span> to site <span className="font-medium">{site}</span>?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmation}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
