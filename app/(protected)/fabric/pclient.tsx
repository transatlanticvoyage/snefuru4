'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ZhedoriButtonBar from '@/app/components/ZhedoriButtonBar';

export default function FabricClient() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Force refresh to clear any cache issues
  console.log('Fabric page loaded');
  const [activeTab, setActiveTab] = useState(1);
  const [industries, setIndustries] = useState<{industry_id: number, industry_name: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFirstConfirm, setShowFirstConfirm] = useState(false);
  const [showSecondConfirm, setShowSecondConfirm] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [fabricationLaunches, setFabricationLaunches] = useState<any[]>([]);
  const [cncglubRowCount, setCncglubRowCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [userInternalId, setUserInternalId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    country: 'United States',
    industry_id: '',
    city_population_filter: 'all',
    kwslot: 'kwslot1',
    kw_rubric: 'deck builder (city_name) (state_code)',
    rel_dfs_location_code: '2840',
    language_code: 'en',
    tag_name: 'deck cncs 1'
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // Get user internal ID
  useEffect(() => {
    const getUserInternalId = async () => {
      if (!user) return;
      
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: userData, error } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!error && userData) {
        setUserInternalId(userData.id);
      }
    };

    getUserInternalId();
  }, [user]);

  // Fetch industries data
  useEffect(() => {
    const fetchIndustries = async () => {
      if (!user) return;
      
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('industries')
        .select('industry_id, industry_name')
        .order('industry_name', { ascending: true });

      if (!error && data) {
        setIndustries(data);
      }
    };

    fetchIndustries();
  }, [user]);

  // Fetch fabrication launches for Tab 2
  useEffect(() => {
    const fetchFabricationLaunches = async () => {
      if (!user) return;
      
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('fabrication_launches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setFabricationLaunches(data);
      }
    };

    fetchFabricationLaunches();
  }, [user]);

  // Refresh fabrication launches after successful F370 process
  const refreshFabricationLaunches = async () => {
    if (!user) return;
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('fabrication_launches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setFabricationLaunches(data);
    }
  };

  const handleF370Process = () => {
    setShowFirstConfirm(true);
  };

  const handleFirstConfirm = () => {
    setShowFirstConfirm(false);
    setShowSecondConfirm(true);
  };

  const handleSecondConfirm = async () => {
    setShowSecondConfirm(false);
    setIsProcessing(true);

    if (!userInternalId) {
      setIsSuccess(false);
      setResultMessage('❌ Error: User internal ID not found');
      setIsProcessing(false);
      setShowResultModal(true);
      return;
    }

    try {
      const response = await fetch('/api/f370', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          user_internal_id: userInternalId
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setResultMessage(
          `✅ F370 Process Completed Successfully!\n\n\n` +
          `• Identified ${result.cncglub_rows_identified} cncglub rows matching the criteria\n` +
          `• Created ${result.keywords_created} new keywords\n` +
          `• Found ${result.keywords_existing} keywords that already existed\n` +
          `• Created tag in keywordshub_tags db table: ${result.tag_name} (ID: ${result.tag_id})\n` +
          `• Made sure all ${result.keywords_total} keywords were added to it\n` +
          `• Updated ${result.cncglub_rows_updated} cncglub rows at ${formData.kwslot} to reference all ${result.keywords_total} keywords in keywordshub db table\n` +
          `• Launch ID: ${result.launch_id}\n\n` +
          `Process completed at: ${new Date().toLocaleString()}`
        );
        // Refresh fabrication launches data
        await refreshFabricationLaunches();
      } else {
        setIsSuccess(false);
        setResultMessage(`❌ Error: ${result.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error('F370 process error:', error);
      setIsSuccess(false);
      setResultMessage('❌ Network error occurred while running F370 process');
    } finally {
      setIsProcessing(false);
      setShowResultModal(true);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Message copied to clipboard!');
    });
  };

  const handleInputChange = (field: string, value: string) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    
    setFormData(newFormData);
    
    // Only trigger count update for filter fields (first 3 rows)
    if (['country', 'industry_id', 'city_population_filter'].includes(field)) {
      getCncglubRowCountWithData(newFormData);
    }
  };

  // Function to get cncglub row count based on provided form data
  const getCncglubRowCountWithData = async (data: typeof formData) => {
    if (!user) return;
    
    setIsLoadingCount(true);
    
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      let cncglubQuery = supabase
        .from('cncglub')
        .select('cncg_id, cities!rel_city_id(country, city_population)', { count: 'exact', head: true })
        .not('rel_city_id', 'is', null);

      // Apply country filter
      if (data.country && data.country !== '') {
        cncglubQuery = cncglubQuery.eq('cities.country', data.country);
      }

      // Apply industry filter
      if (data.industry_id && data.industry_id !== '') {
        cncglubQuery = cncglubQuery.eq('rel_industry_id', parseInt(data.industry_id));
      }

      // Apply city population filter
      if (data.city_population_filter && data.city_population_filter !== 'all') {
        switch (data.city_population_filter) {
          case 'under-25k':
            cncglubQuery = cncglubQuery.lt('cities.city_population', 25000);
            break;
          case '25k-50k':
            cncglubQuery = cncglubQuery.gte('cities.city_population', 25000).lt('cities.city_population', 50000);
            break;
          case '50k-100k':
            cncglubQuery = cncglubQuery.gte('cities.city_population', 50000).lt('cities.city_population', 100000);
            break;
          case '75k-325k':
            cncglubQuery = cncglubQuery.gte('cities.city_population', 75000).lt('cities.city_population', 325000);
            break;
          case '100k-500k':
            cncglubQuery = cncglubQuery.gte('cities.city_population', 100000).lt('cities.city_population', 500000);
            break;
          case '500k-plus':
            cncglubQuery = cncglubQuery.gte('cities.city_population', 500000);
            break;
          case '35k-325k':
            cncglubQuery = cncglubQuery.gte('cities.city_population', 35000).lt('cities.city_population', 325000);
            break;
          case '40k-325k':
            cncglubQuery = cncglubQuery.gte('cities.city_population', 40000).lt('cities.city_population', 325000);
            break;
          case '50k-325k':
            cncglubQuery = cncglubQuery.gte('cities.city_population', 50000).lt('cities.city_population', 325000);
            break;
        }
      }

      const { count, error } = await cncglubQuery;

      if (!error) {
        setCncglubRowCount(count || 0);
      } else {
        console.error('Error getting cncglub count:', error);
        setCncglubRowCount(null);
      }
    } catch (error) {
      console.error('Error getting cncglub count:', error);
      setCncglubRowCount(null);
    } finally {
      setIsLoadingCount(false);
    }
  };

  // Function to get cncglub row count based on current filters
  const getCncglubRowCount = async () => {
    return getCncglubRowCountWithData(formData);
  };

  // Get initial count when component loads
  useEffect(() => {
    if (user) {
      getCncglubRowCount();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-gray-800">Fabricator System</h1>
            <ZhedoriButtonBar />
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Fabricator Management</div>
            <div className="text-xs text-gray-400">Project: Fabric System</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab(1)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 1
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tab 1
              </button>
              <button
                onClick={() => setActiveTab(2)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 2
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tab 2
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 1 && (
            <div>
              {/* Table title */}
              <div className="mb-4">
                <span className="font-bold text-lg">saskatoon ui table</span>
              </div>
              
              {/* 4-column table */}
              <table className="border-collapse table-auto">
                {/* Header row - numbered with light gray background */}
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-300 p-3 font-normal">0</th>
                    <th className="border border-gray-300 p-3 font-normal">1</th>
                    <th className="border border-gray-300 p-3 font-normal">2</th>
                    <th className="border border-gray-300 p-3 font-normal">3</th>
                    <th className="border border-gray-300 p-3 font-normal">4</th>
                    <th className="border border-gray-300 p-3 font-normal">5</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1 */}
                  <tr>
                    <td className="border border-gray-300 p-3 bg-gray-200 border-t-black border-t-[4px]">1</td>
                    <td className="border border-gray-300 p-3 border-t-black border-t-[4px]">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="w-5 h-5 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-sm flex items-center justify-center text-xs"
                          onClick={() => navigator.clipboard.writeText('cncglub option - select country')}
                          title="Copy to clipboard"
                        >
                          ⧉
                        </button>
                        <span className="font-bold">cncglub option - select country</span>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3 border-t-black border-t-[4px]">
                      <select 
                        className="w-full px-2 py-1 border border-gray-300 rounded" 
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                      >
                        <option value="Australia">Australia</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="United States">United States</option>
                        <option value="New Zealand">New Zealand</option>
                        <option value="South Africa">South Africa</option>
                      </select>
                    </td>
                    <td className="border border-gray-300 p-3 border-t-black border-t-[4px]"></td>
                    <td className="border border-gray-300 p-3 border-t-black border-t-[4px]"></td>
                    <td className="border border-gray-300 p-3 border-t-black border-t-[4px]"></td>
                  </tr>
                  {/* Row 2 */}
                  <tr>
                    <td className="border border-gray-300 p-3 bg-gray-200">2</td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="w-5 h-5 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-sm flex items-center justify-center text-xs"
                          onClick={() => navigator.clipboard.writeText('cncglub option - select industry')}
                          title="Copy to clipboard"
                        >
                          ⧉
                        </button>
                        <span className="font-bold">cncglub option - select industry</span>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <select 
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        value={formData.industry_id}
                        onChange={(e) => handleInputChange('industry_id', e.target.value)}
                      >
                        <option value="">Select industry...</option>
                        {industries.map((industry) => (
                          <option key={industry.industry_id} value={industry.industry_id}>
                            {industry.industry_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-300 p-3"></td>
                    <td className="border border-gray-300 p-3"></td>
                    <td className="border border-gray-300 p-3"></td>
                  </tr>
                  {/* Row 3 */}
                  <tr>
                    <td className="border border-gray-300 p-3 bg-gray-200">3</td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="w-5 h-5 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-sm flex items-center justify-center text-xs"
                          onClick={() => navigator.clipboard.writeText('cncglub option - select cities')}
                          title="Copy to clipboard"
                        >
                          ⧉
                        </button>
                        <span className="font-bold">cncglub option - select cities</span>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <select 
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        value={formData.city_population_filter}
                        onChange={(e) => handleInputChange('city_population_filter', e.target.value)}
                      >
                        <option value="all">All Records</option>
                        <option value="75k-325k">75k-325k</option>
                        <option value="under-25k">Under 25k</option>
                        <option value="25k-50k">25k - 50k</option>
                        <option value="50k-100k">50k - 100k</option>
                        <option value="100k-500k">100k - 500k</option>
                        <option value="500k-plus">500k+</option>
                        <option disabled>---------</option>
                        <option value="35k-325k">35k-325k</option>
                        <option value="40k-325k">40k-325k</option>
                        <option value="50k-325k">50k-325k</option>
                      </select>
                    </td>
                    <td className="border border-gray-300 p-3"></td>
                    <td className="border border-gray-300 p-3"></td>
                    <td className="border border-gray-300 p-3"></td>
                  </tr>
                  {/* Row 4 */}
                  <tr>
                    <td className="border border-gray-300 p-3 bg-gray-200 border-t-black border-t-[4px]">4</td>
                    <td className="border border-gray-300 p-3 border-t-black border-t-[4px]">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="w-5 h-5 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-sm flex items-center justify-center text-xs"
                          onClick={() => navigator.clipboard.writeText('kwslot option - kwslot to populate')}
                          title="Copy to clipboard"
                        >
                          ⧉
                        </button>
                        <span className="font-bold">kwslot option - kwslot to populate</span>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3 border-t-black border-t-[4px]">
                      <select 
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        value={formData.kwslot}
                        onChange={(e) => handleInputChange('kwslot', e.target.value)}
                      >
                        <option value="">Select kwslot...</option>
                        <option value="kwslot1">kwslot1</option>
                        <option value="kwslot2">kwslot2</option>
                        <option value="kwslot3">kwslot3</option>
                        <option value="kwslot4">kwslot4</option>
                        <option value="kwslot5">kwslot5</option>
                        <option value="kwslot6">kwslot6</option>
                        <option value="kwslot7">kwslot7</option>
                        <option value="kwslot8">kwslot8</option>
                        <option value="kwslot9">kwslot9</option>
                        <option value="kwslot10">kwslot10</option>
                      </select>
                    </td>
                    <td className="border border-gray-300 p-3 border-t-black border-t-[4px]">cncglub.kwslot*</td>
                    <td className="border border-gray-300 p-3 border-t-black border-t-[4px]"></td>
                    <td className="border border-gray-300 p-3 border-t-black border-t-[4px]"></td>
                  </tr>
                  {/* Row 5 */}
                  <tr>
                    <td className="border border-gray-300 p-3 bg-gray-200 border-t-black border-t-[4px]">5</td>
                    <td className="border border-gray-300 p-3 border-t-black border-t-[4px]">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="w-5 h-5 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-sm flex items-center justify-center text-xs"
                          onClick={() => navigator.clipboard.writeText('kwhub option - kw rubric')}
                          title="Copy to clipboard"
                        >
                          ⧉
                        </button>
                        <span className="font-bold">kwhub option - kw rubric</span>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3 min-w-80 border-t-black border-t-[4px]">
                      <input 
                        type="text" 
                        placeholder="deck builder (city_name) (state_code)"
                        className="w-full px-2 py-1 border border-gray-300 rounded min-w-72"
                        value={formData.kw_rubric}
                        onChange={(e) => handleInputChange('kw_rubric', e.target.value)}
                      />
                    </td>
                    <td className="border border-gray-300 p-3 border-t-black border-t-[4px]">keywordshub.keyword_datum</td>
                    <td className="border border-gray-300 p-3 border-t-black border-t-[4px]"></td>
                    <td className="border border-gray-300 p-3 border-t-black border-t-[4px]"></td>
                  </tr>
                  {/* Row 6 */}
                  <tr>
                    <td className="border border-gray-300 p-3 bg-gray-200">6</td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="w-5 h-5 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-sm flex items-center justify-center text-xs"
                          onClick={() => navigator.clipboard.writeText('kwhub option - rel_dfs_location_code')}
                          title="Copy to clipboard"
                        >
                          ⧉
                        </button>
                        <span className="font-bold">kwhub option - rel_dfs_location_code</span>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <input 
                        type="text" 
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        value={formData.rel_dfs_location_code}
                        onChange={(e) => handleInputChange('rel_dfs_location_code', e.target.value)}
                      />
                    </td>
                    <td className="border border-gray-300 p-3">keywordshub.rel_dfs_location_code</td>
                    <td className="border border-gray-300 p-3"></td>
                    <td className="border border-gray-300 p-3"></td>
                  </tr>
                  {/* Row 7 */}
                  <tr>
                    <td className="border border-gray-300 p-3 bg-gray-200 border-b-black border-b-[4px]">7</td>
                    <td className="border border-gray-300 p-3 border-b-black border-b-[4px]">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="w-5 h-5 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-sm flex items-center justify-center text-xs"
                          onClick={() => navigator.clipboard.writeText('kwhub option - language_code')}
                          title="Copy to clipboard"
                        >
                          ⧉
                        </button>
                        <span className="font-bold">kwhub option - language_code</span>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3 border-b-black border-b-[4px]">
                      <input 
                        type="text" 
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        value={formData.language_code}
                        onChange={(e) => handleInputChange('language_code', e.target.value)}
                      />
                    </td>
                    <td className="border border-gray-300 p-3 border-b-black border-b-[4px]">keywordshub.language_code</td>
                    <td className="border border-gray-300 p-3 border-b-black border-b-[4px]"></td>
                    <td className="border border-gray-300 p-3 border-b-black border-b-[4px]"></td>
                  </tr>
                  {/* Row 8 */}
                  <tr>
                    <td className="border border-gray-300 p-3 bg-gray-200 border-b-black border-b-[4px]">8</td>
                    <td className="border border-gray-300 p-3 border-b-black border-b-[4px]">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="w-5 h-5 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-sm flex items-center justify-center text-xs"
                          onClick={() => navigator.clipboard.writeText('tag option - keywordshub_tags.tag_name')}
                          title="Copy to clipboard"
                        >
                          ⧉
                        </button>
                        <span className="font-bold">tag option - keywordshub_tags.tag_name</span>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3 border-b-black border-b-[4px]">
                      <input 
                        type="text" 
                        placeholder="deck cncs 1"
                        className="w-full px-2 py-1 border border-gray-300 rounded placeholder-gray-400"
                        value={formData.tag_name}
                        onChange={(e) => handleInputChange('tag_name', e.target.value)}
                      />
                    </td>
                    <td className="border border-gray-300 p-3 border-b-black border-b-[4px]"></td>
                    <td className="border border-gray-300 p-3 border-b-black border-b-[4px]"></td>
                    <td className="border border-gray-300 p-3 border-b-black border-b-[4px]"></td>
                  </tr>
                </tbody>
              </table>
              
              {/* Row Count Display Box */}
              <div className="mt-6">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-blue-800 font-semibold">
                        Rows matching current criteria:
                      </span>
                    </div>
                    <div className="text-right">
                      {isLoadingCount ? (
                        <div className="flex items-center">
                          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                          <span className="text-blue-600 text-sm">Counting...</span>
                        </div>
                      ) : (
                        <span className="text-blue-900 text-2xl font-bold">
                          {cncglubRowCount !== null ? cncglubRowCount.toLocaleString() : '—'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-blue-700 text-sm">
                    This is how many cncglub rows will be processed when F370 runs
                  </div>
                </div>
              </div>

              {/* Red button below table */}
              <div className="mt-2">
                <button 
                  className={`px-4 py-2 rounded text-white font-medium ${
                    isProcessing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  onClick={handleF370Process}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing F370...' : 'Run f370 populate kwslot* in cncglub'}
                </button>
              </div>

              {/* Codebox area */}
              <div className="mt-6 w-[700px] border border-gray-300 rounded">
                {/* Header with label and copy button */}
                <div className="bg-gray-100 border-b border-gray-300 p-2 flex items-center">
                  <span className="font-bold mr-3">process description box</span>
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                    Copy
                  </button>
                </div>
                {/* Code content */}
                <div className="p-4 bg-gray-50 font-mono text-sm whitespace-pre-line">
{`———————————————————————


summary of how the f370 function should work

user will "run" this function by pressing button on /fabric page

it must show user a double warning popup that this is a signficant process and they must confirm 2 times
———————————————————————
———————————————————————

the gist of what will happen:

———————————————————————
• identify all db rows in db table cncglub that match the criteria in these options

cncglub option - select country
cncglub option - select industry
cncglub option - select cities

please note that country and cities options here are related to db columns that exist in db table cities

these must be filtered through a relationship field in cncglub that connects the foreign key to the cities db table

and the same for the industry option (which corresponds to industries db table - which also has foreign key relationship field in cncglub db table)


———————————————————————
• for all cncglub rows that match the criteria above, create new keywords in db table keywordshub (if they do not exist)

• if user has entered these dynamic shortcodes like (city_name) and/or (state_code), the system must pull the value from the associated db row and db columns in the cities db table and insert it into the keyword_datum entry that we're creating as plain text (not shortcode - shortcode is being "rendered" at this stage that I'm describing)
———————————————————————
• create a new tag in keywordshub_tags db table

———————————————————————
• tag all kws with a special tag (including ones that did previously exist(if any)  and didn't have to be created because they match the criteria set here)

the criteria I'm referring to is a match to the options of:

kwhub option - kw rubric (the end output after dynamic short codes are rendered into end-text)
kwhub option - rel_dfs_location_code
kwhub option - language_code

———————————————————————

next, populate the field cncglub.kwslot* (the asterisk corresponds to "kwslot option - kwslot to populate") with the keyword_id number for the keyword that was created related to that specific cncglub row 


———————————————————————`}
                </div>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div>
              {/* Table title */}
              <div className="mb-4">
                <span className="font-bold text-lg">db table: fabrication_launches</span>
              </div>
              
              {/* Fabrication Launches Table */}
              <table className="border-collapse table-auto">
                {/* Header row with gray background */}
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-300 p-3 font-bold text-left">launch_id</th>
                    <th className="border border-gray-300 p-3 font-bold text-left">rel_keywordshub_tag_id</th>
                    <th className="border border-gray-300 p-3 font-bold text-left">created_at</th>
                    <th className="border border-gray-300 p-3 font-bold text-left">user_id</th>
                    <th className="border border-gray-300 p-3 font-bold text-left">opt_country</th>
                    <th className="border border-gray-300 p-3 font-bold text-left">opt_industry_id</th>
                    <th className="border border-gray-300 p-3 font-bold text-left">opt_city_population_filter</th>
                    <th className="border border-gray-300 p-3 font-bold text-left">opt_kw_style</th>
                    <th className="border border-gray-300 p-3 font-bold text-left">opt_kw_slot</th>
                    <th className="border border-gray-300 p-3 font-bold text-left">opt_rel_dfs_location_code</th>
                    <th className="border border-gray-300 p-3 font-bold text-left">opt_language_code</th>
                    <th className="border border-gray-300 p-3 font-bold text-left">status</th>
                  </tr>
                </thead>
                <tbody>
                  {fabricationLaunches.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="border border-gray-300 p-4 text-center text-gray-500 italic">
                        No fabrication launches yet. Run F370 function to see data here.
                      </td>
                    </tr>
                  ) : (
                    fabricationLaunches.map((launch, index) => (
                      <tr key={launch.launch_id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="border border-gray-300 p-2 text-xs">{launch.launch_id}</td>
                        <td className="border border-gray-300 p-2 text-xs">{launch.rel_keywordshub_tag_id || 'N/A'}</td>
                        <td className="border border-gray-300 p-2 text-xs">
                          {launch.created_at ? new Date(launch.created_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="border border-gray-300 p-2 text-xs">{launch.user_id || 'N/A'}</td>
                        <td className="border border-gray-300 p-2 text-xs">{launch.opt_country || 'N/A'}</td>
                        <td className="border border-gray-300 p-2 text-xs">{launch.opt_industry_id || 'N/A'}</td>
                        <td className="border border-gray-300 p-2 text-xs">{launch.opt_city_population_filter || 'N/A'}</td>
                        <td className="border border-gray-300 p-2 text-xs max-w-32 truncate" title={launch.opt_kw_style}>
                          {launch.opt_kw_style || 'N/A'}
                        </td>
                        <td className="border border-gray-300 p-2 text-xs">{launch.opt_kw_slot || 'N/A'}</td>
                        <td className="border border-gray-300 p-2 text-xs">{launch.opt_rel_dfs_location_code || 'N/A'}</td>
                        <td className="border border-gray-300 p-2 text-xs">{launch.opt_language_code || 'N/A'}</td>
                        <td className="border border-gray-300 p-2 text-xs">
                          <span className={`px-2 py-1 rounded text-xs ${
                            launch.status === 'completed' ? 'bg-green-100 text-green-800' :
                            launch.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {launch.status || 'unknown'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* First Confirmation Modal */}
      {showFirstConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-red-600 text-lg">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Warning - Significant Process</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">
                You are about to run the <strong>F370 function</strong> which will create keywords and modify database records. 
                This is a significant process that cannot be easily undone.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                <strong>Important:</strong> This operation will make permanent changes to your database. 
                Please ensure you have reviewed all settings carefully.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowFirstConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleFirstConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Second Confirmation Modal */}
      {showSecondConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-red-600 text-lg">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold text-red-700">FINAL WARNING</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">This process will perform the following operations:</p>
              
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Filter cncglub records based on your criteria
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Create new keywords in keywordshub table
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Create a new tag and assign it to keywords
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Update cncglub kwslot fields
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Create a fabrication_launches record
                </li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm font-medium">
                This process will affect multiple database tables and cannot be undone.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowSecondConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSecondConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <div className="flex items-center mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                isSuccess ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <span className={`text-lg ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                  {isSuccess ? '✅' : '❌'}
                </span>
              </div>
              <h3 className={`text-lg font-semibold ${
                isSuccess ? 'text-green-700' : 'text-red-700'
              }`}>
                {isSuccess ? 'Process Completed' : 'Process Failed'}
              </h3>
            </div>
            
            <div className="mb-6">
              <div className={`rounded-lg p-4 ${
                isSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <pre className={`text-sm whitespace-pre-wrap ${
                  isSuccess ? 'text-green-800' : 'text-red-800'
                }`}>
                  {resultMessage}
                </pre>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => copyToClipboard(resultMessage)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center"
              >
                <span className="mr-2">📋</span>
                Copy Message
              </button>
              <button
                onClick={() => setShowResultModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing F370...</h3>
              <p className="text-gray-600 text-sm">Please wait while we process your request. This may take a few moments.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}