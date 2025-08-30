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

  useEffect(() => {
    // Extract URL parameters
    const typeParam = searchParams?.get('type') || '';
    const siteParam = searchParams?.get('site') || '';
    const userParam = searchParams?.get('user') || '';
    
    setType(typeParam);
    setSite(siteParam);
    setUser(userParam);
    
    if (typeParam && siteParam && userParam) {
      loadData(typeParam);
    } else {
      setError('Missing required parameters: type, site, or user');
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
      setError(`Failed to load data: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async () => {
    const { data, error } = await supabase
      .from('cities')
      .select('city_id, city_name, state_code, country_code')
      .order('city_name');
    
    if (error) throw error;
    setCities(data || []);
    setFilteredData(data || []);
  };

  const loadIndustries = async () => {
    const { data, error } = await supabase
      .from('industries')
      .select('industry_id, industry_name, industry_category')
      .order('industry_name');
    
    if (error) throw error;
    setIndustries(data || []);
    setFilteredData(data || []);
  };

  const loadCncglubs = async () => {
    const { data, error } = await supabase
      .from('cncglub')
      .select('cncg_id, cncg_name, cncg_description')
      .order('cncg_name');
    
    if (error) throw error;
    setCncglubs(data || []);
    setFilteredData(data || []);
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
