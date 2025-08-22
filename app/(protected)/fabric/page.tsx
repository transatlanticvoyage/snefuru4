'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ZhedoriButtonBar from '@/app/components/ZhedoriButtonBar';

export default function FabricPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(1);
  const [industries, setIndustries] = useState<{industry_id: number, industry_name: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
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

  // Set page title
  useEffect(() => {
    document.title = '/fabric - Snefuru';
  }, []);

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

  const handleF370Process = async () => {
    // Double confirmation popup
    const firstConfirm = window.confirm(
      "⚠️ WARNING: You are about to run the F370 function which will create keywords and modify database records. This is a significant process that cannot be easily undone.\n\nAre you sure you want to continue?"
    );

    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      "⚠️ FINAL WARNING: This will:\n" +
      "• Filter cncglub records based on your criteria\n" +
      "• Create new keywords in keywordshub table\n" +
      "• Create a new tag and assign it to keywords\n" +
      "• Update cncglub kwslot fields\n" +
      "• Create a fabrication_launches record\n\n" +
      "This process will affect multiple database tables. Are you absolutely certain you want to proceed?"
    );

    if (!secondConfirm) return;

    setIsProcessing(true);

    try {
      const response = await fetch('/api/f370', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ F370 Process Completed Successfully!\n\n` +
              `• Processed ${result.keywords_processed} keywords\n` +
              `• Updated ${result.cncglub_rows_processed} cncglub rows\n` +
              `• Created tag: ${result.tag_name} (ID: ${result.tag_id})\n` +
              `• Launch ID: ${result.launch_id}`);
      } else {
        alert(`❌ Error: ${result.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error('F370 process error:', error);
      alert('❌ Network error occurred while running F370 process');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
              
              {/* Red button below table */}
              <div className="mt-6">
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
                {/* Empty tbody - no data rows yet */}
                <tbody>
                  {/* No rows until f370 function is created and executed */}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}