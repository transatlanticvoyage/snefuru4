'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const DrenjariButtonBarDriggsmanLinks = dynamic(
  () => import('@/app/components/DrenjariButtonBarDriggsmanLinks'),
  { ssr: false }
);

const AddressjarTable = dynamic(
  () => import('./components/AddressjarTable'),
  { ssr: false }
);


export default function AddressjarClient() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  // Column pagination control state
  const [columnPaginationControls, setColumnPaginationControls] = useState<{
    ColumnPaginationBar1: () => JSX.Element | null;
    ColumnPaginationBar2: () => JSX.Element | null;
  } | null>(null);
  
  // PillarShift Column Template System modal state
  const [isPillarShiftModalOpen, setIsPillarShiftModalOpen] = useState(false);
  const [sheafData, setSheafData] = useState<string>('');
  const [sheafLoading, setSheafLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('rtab1');
  const [monolithData, setMonolithData] = useState<string>('');
  const [monolithLoading, setMonolithLoading] = useState(false);
  
  // Coltemps data state
  const [coltempsData, setColtempsData] = useState<any[]>([]);
  const [coltempsLoading, setColtempsLoading] = useState(false);
  const [coltempsError, setColtempsError] = useState<string | null>(null);

  // Function to ensure addressjar UTG exists and fetch sheaf data
  const fetchSheafData = async () => {
    setSheafLoading(true);
    try {
      // Real column structure based on AddressjarTable component analysis
      const realSheafData = {
        columns: [
          // addresspren columns
          { id: 'addresspren_id', name: 'addresspren_id', type: 'number', readOnly: true, width: '120px', group: 'addresspren', visible: true, order: 1 },
          { id: 'fk_addressglub_id', name: 'fk_addressglub_id', type: 'number', width: '140px', group: 'addresspren', visible: true, order: 2 },
          { id: 'address_label', name: 'address_label', type: 'text', width: '150px', group: 'addresspren', visible: true, order: 3 },
          
          // org entity columns
          { id: 'separator_org', name: '', type: 'separator', width: '3px', separator: 'vertical', visible: true, order: 4 },
          { id: 'org_is_starred', name: 'star', type: 'org_entity', width: '25px', group: 'org_entities', visible: true, order: 5 },
          { id: 'org_is_flagged', name: 'flag', type: 'org_entity', width: '25px', group: 'org_entities', visible: true, order: 6 },
          { id: 'org_is_circled', name: 'circle', type: 'org_entity', width: '25px', group: 'org_entities', visible: true, order: 7 },
          { id: 'org_is_squared', name: 'square', type: 'org_entity', width: '25px', group: 'org_entities', visible: true, order: 8 },
          { id: 'org_is_triangled', name: 'triangle', type: 'org_entity', width: '25px', group: 'org_entities', visible: true, order: 9 },
          { id: 'related_sites_internal', name: 'related sites (internal)', type: 'text', width: '120px', group: 'addresspren', visible: true, order: 10 },
          { id: 'related_sites_external', name: 'related sites (external)', type: 'text', width: '120px', group: 'addresspren', visible: true, order: 11 },
          { id: 'full_address_input', name: 'full_address_input', type: 'text', width: 'auto', minWidth: '350px', group: 'addressglub', separator: 'right', visible: true, order: 12 },
          { id: 'internal_notes', name: 'internal_notes', type: 'text', width: '200px', group: 'addresspren', visible: true, order: 13 },
          { id: 'address_purpose', name: 'address_purpose', type: 'text', width: '150px', group: 'addresspren', visible: true, order: 14 },
          { id: 'is_primary', name: 'is_primary', type: 'boolean', width: '100px', group: 'addresspren', visible: true, order: 15 },
          { id: 'is_active', name: 'is_active', type: 'boolean', width: '100px', group: 'addresspren', visible: true, order: 16 },
          { id: 'is_favorite', name: 'is_favorite', type: 'boolean', width: '100px', group: 'addresspren', visible: true, order: 17 },
          { id: 'last_used_at', name: 'last_used_at', type: 'datetime', readOnly: true, width: '160px', group: 'addresspren', visible: true, order: 18 },
          { id: 'usage_count', name: 'usage_count', type: 'number', width: '120px', group: 'addresspren', visible: true, order: 19 },
          { id: 'addresspren_created_at', name: 'created_at', type: 'datetime', readOnly: true, width: '160px', group: 'addresspren', separator: 'right', visible: true, order: 20 },
          
          // addressglub columns
          { id: 'addressglub_id', name: 'addressglub_id', type: 'number', readOnly: true, width: '120px', group: 'addressglub', visible: true, order: 21 },
          { id: 'street_1', name: 'street_1', type: 'text', width: '200px', group: 'addressglub', visible: true, order: 22 },
          { id: 'street_2', name: 'street_2', type: 'text', width: '200px', group: 'addressglub', visible: true, order: 23 },
          { id: 'city', name: 'city', type: 'text', width: '150px', group: 'addressglub', visible: true, order: 24 },
          { id: 'state_code', name: 'state_code', type: 'text', width: '100px', group: 'addressglub', visible: true, order: 25 },
          { id: 'state_full', name: 'state_full', type: 'text', width: '150px', group: 'addressglub', visible: true, order: 26 },
          { id: 'zip_code', name: 'zip_code', type: 'text', width: '100px', group: 'addressglub', visible: true, order: 27 },
          { id: 'country_code', name: 'country_code', type: 'text', width: '100px', group: 'addressglub', visible: true, order: 28 },
          { id: 'country', name: 'country', type: 'text', width: '150px', group: 'addressglub', visible: true, order: 29 },
          { id: 'street_1_clean', name: 'street_1_clean', type: 'text', readOnly: true, width: '200px', group: 'addressglub', visible: true, order: 30 },
          { id: 'full_address_formatted', name: 'full_address_formatted', type: 'text', readOnly: true, width: '300px', group: 'addressglub', visible: true, order: 31 },
          { id: 'latitude', name: 'latitude', type: 'number', readOnly: true, width: '120px', group: 'addressglub', visible: true, order: 32 },
          { id: 'longitude', name: 'longitude', type: 'number', readOnly: true, width: '120px', group: 'addressglub', visible: true, order: 33 },
          { id: 'is_validated', name: 'is_validated', type: 'boolean', readOnly: true, width: '100px', group: 'addressglub', visible: true, order: 34 },
          { id: 'validation_source', name: 'validation_source', type: 'text', readOnly: true, width: '150px', group: 'addressglub', visible: true, order: 35 },
          { id: 'validation_accuracy', name: 'validation_accuracy', type: 'text', readOnly: true, width: '150px', group: 'addressglub', visible: true, order: 36 },
          { id: 'plus_four', name: 'plus_four', type: 'text', width: '100px', group: 'addressglub', visible: true, order: 37 },
          { id: 'fk_city_id', name: 'fk_city_id', type: 'number', readOnly: true, width: '100px', group: 'addressglub', visible: true, order: 38 },
          { id: 'fk_address_species_id', name: 'fk_address_species_id', type: 'number', readOnly: true, width: '180px', group: 'addressglub', visible: true, order: 39 },
          { id: 'addressglub_usage_count', name: 'usage_count', type: 'number', readOnly: true, width: '120px', group: 'addressglub', visible: true, order: 40 },
          { id: 'quality_score', name: 'quality_score', type: 'number', readOnly: true, width: '120px', group: 'addressglub', visible: true, order: 41 },
          { id: 'confidence_level', name: 'confidence_level', type: 'number', readOnly: true, width: '140px', group: 'addressglub', visible: true, order: 42 },
          { id: 'is_business', name: 'is_business', type: 'boolean', readOnly: true, width: '100px', group: 'addressglub', visible: true, order: 43 },
          { id: 'is_residential', name: 'is_residential', type: 'boolean', readOnly: true, width: '120px', group: 'addressglub', visible: true, order: 44 },
          { id: 'is_po_box', name: 'is_po_box', type: 'boolean', readOnly: true, width: '100px', group: 'addressglub', visible: true, order: 45 },
          { id: 'is_apartment', name: 'is_apartment', type: 'boolean', readOnly: true, width: '120px', group: 'addressglub', visible: true, order: 46 },
          { id: 'is_suite', name: 'is_suite', type: 'boolean', readOnly: true, width: '100px', group: 'addressglub', visible: true, order: 47 },
          { id: 'data_source', name: 'data_source', type: 'text', width: '120px', group: 'addressglub', visible: true, order: 48 },
          { id: 'source_reference', name: 'source_reference', type: 'text', width: '180px', group: 'addressglub', visible: true, order: 49 },
          { id: 'addressglub_created_at', name: 'created_at', type: 'datetime', readOnly: true, width: '160px', group: 'addressglub', visible: true, order: 50 },
          { id: 'addressglub_updated_at', name: 'updated_at', type: 'datetime', readOnly: true, width: '160px', group: 'addressglub', visible: true, order: 51 },
          { id: 'address_hash', name: 'address_hash', type: 'text', readOnly: true, width: '200px', group: 'addressglub', visible: true, order: 52 }
        ],
        metadata: {
          table_name: 'addresspren + addressglub (joined)',
          description: 'Address Constellation System - User addresses joined with global address database',
          main_db_table: 'addresspren',
          joined_tables: ['addressglub'],
          created_date: new Date().toISOString(),
          column_groups: {
            'addresspren': 'User-specific address records and preferences',
            'addressglub': 'Global address database with validation and standardization',
            'org_entities': 'Organization entity flags (star, flag, circle, square, triangle)'
          }
        }
      };

      // First try to fetch existing record
      let { data, error } = await supabase
        .from('utgs')
        .select('sheaf_ui_columns_base_foundation')
        .eq('utg_id', 'addressjar')
        .single();

      // If record doesn't exist, create it
      if (error && error.code === 'PGRST116') {
        console.log('addressjar UTG record not found, creating it...');
        
        const { data: newRecord, error: createError } = await supabase
          .from('utgs')
          .insert({
            utg_id: 'addressjar',
            utg_name: 'Address Constellation System',
            utg_description: 'Main address management interface',
            main_db_table: 'addresses',
            sheaf_ui_columns_base_foundation: realSheafData,
            is_active: true,
            horomi_active: false,
            vertomi_active: false,
            sort_order: 1
          })
          .select('sheaf_ui_columns_base_foundation')
          .single();
          
        if (createError) {
          throw createError;
        }
        
        data = newRecord;
        console.log('Created addressjar UTG record successfully');
      } else if (error) {
        throw error;
      } else {
        // Record exists, check if it has dummy/old data and update it
        const currentData = data?.sheaf_ui_columns_base_foundation;
        const isDummyData = currentData && 
          currentData.columns && 
          currentData.columns.length < 20 && // Less than 20 columns indicates dummy data
          currentData.columns.some((col: any) => col.id === 'address_id' || col.id === 'street_address'); // Contains dummy column names

        if (isDummyData || !currentData) {
          console.log('Updating addressjar UTG record with real column data...');
          
          const { data: updatedRecord, error: updateError } = await supabase
            .from('utgs')
            .update({ sheaf_ui_columns_base_foundation: realSheafData })
            .eq('utg_id', 'addressjar')
            .select('sheaf_ui_columns_base_foundation')
            .single();
            
          if (updateError) {
            throw updateError;
          }
          
          data = updatedRecord;
          console.log('Updated addressjar UTG record with real column data successfully');
        }
      }

      if (data?.sheaf_ui_columns_base_foundation) {
        setSheafData(JSON.stringify(data.sheaf_ui_columns_base_foundation, null, 2));
      } else {
        setSheafData('{}');
      }
    } catch (error) {
      console.error('Error with sheaf data:', error);
      setSheafData(`Error loading data: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSheafLoading(false);
    }
  };

  // Function to generate monolith from current sheaf
  const generateMonolithFromSheaf = async () => {
    setMonolithLoading(true);
    try {
      // First fetch the current sheaf data
      const { data, error } = await supabase
        .from('utgs')
        .select('sheaf_ui_columns_base_foundation')
        .eq('utg_id', 'addressjar')
        .single();

      if (error) throw error;

      if (!data?.sheaf_ui_columns_base_foundation?.columns) {
        throw new Error('No sheaf column data found');
      }

      // Process sheaf data to create monolith text format
      const columns = data.sheaf_ui_columns_base_foundation.columns;
      
      // Sort columns by order field
      const sortedColumns = [...columns].sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Generate monolith text format
      let monolithText = '';
      sortedColumns.forEach((column) => {
        // Skip separator columns
        if (column.type === 'separator') return;
        
        // Format: group.column_name
        const group = column.group || 'unknown';
        const columnName = column.id || column.name || 'unknown';
        monolithText += `${group}.${columnName}\n`;
      });

      // Update the database with the generated monolith
      const { error: updateError } = await supabase
        .from('utgs')
        .update({ monolith_of_ui_columns: monolithText })
        .eq('utg_id', 'addressjar');

      if (updateError) throw updateError;

      // Set the monolith data for display
      setMonolithData(monolithText);
      
      console.log('Generated monolith from sheaf successfully');
    } catch (error) {
      console.error('Error generating monolith:', error);
      setMonolithData(`Error generating monolith: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setMonolithLoading(false);
    }
  };

  // Function to fetch existing monolith data
  const fetchMonolithData = async () => {
    try {
      const { data, error } = await supabase
        .from('utgs')
        .select('monolith_of_ui_columns')
        .eq('utg_id', 'addressjar')
        .single();

      if (error) throw error;

      setMonolithData(data?.monolith_of_ui_columns || '');
    } catch (error) {
      console.error('Error fetching monolith data:', error);
      setMonolithData('Error loading monolith data');
    }
  };

  // Function to fetch coltemps data
  const fetchColtempsData = async () => {
    if (!user?.id) return;
    
    setColtempsLoading(true);
    setColtempsError(null);
    
    try {
      const { data, error } = await supabase
        .from('coltemps')
        .select('*')
        .eq('rel_utg_id', 'utg_addressjar')
        .or(`fk_user_id.eq.${user.id},coltemp_category.eq.adminpublic`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setColtempsData(data || []);
    } catch (err) {
      console.error('Error fetching coltemps data:', err);
      setColtempsError(err instanceof Error ? err.message : 'Failed to fetch coltemps data');
    } finally {
      setColtempsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

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
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-800">
              <strong>Address Constellation System</strong>
            </h1>
            
            {/* PillarShift Column Template System Button */}
            <button
              onClick={() => {
                setIsPillarShiftModalOpen(true);
                fetchSheafData();
                fetchMonolithData();
                fetchColtempsData();
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors"
            >
              use the pillarshift coltemp system
            </button>
            
            {/* Column Pagination Button Bars */}
            {columnPaginationControls && (
              <>
                <div className="flex items-center">
                  {columnPaginationControls.ColumnPaginationBar1()}
                </div>
                <div className="flex items-center">
                  {columnPaginationControls.ColumnPaginationBar2()}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <DrenjariButtonBarDriggsmanLinks />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <AddressjarTable onColumnPaginationRender={setColumnPaginationControls} />
      </div>

      {/* PillarShift Column Template System Modal */}
      {isPillarShiftModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[95vw] h-[95vh] relative overflow-hidden">
            {/* Close Button */}
            <button
              onClick={() => setIsPillarShiftModalOpen(false)}
              className="absolute top-4 right-4 w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center text-xl font-bold transition-colors z-10"
              title="Close PillarShift System"
            >
              ✕
            </button>
            
            {/* Modal Content */}
            <div className="p-8 h-full flex flex-col">
              <h2 className="text-base font-bold text-gray-800 mb-6">
                PillarShift Column Template System
              </h2>
              
              <p className="text-base text-gray-700 mb-4">
                base foundation of all utg table columns in base order
              </p>
              
              {/* Horizontal Tabs */}
              <div className="flex border-b border-gray-200 mb-6">
                {['rtab1', 'rtab2', 'rtab3', 'rtab4', 'rtab5', 'rtab6', 'rtab7'].map((tab, index) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-blue-600 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab === 'rtab1' ? 'rtab1 - sheaf' : tab}
                  </button>
                ))}
              </div>
              
              {/* Tab Content */}
              {activeTab === 'rtab1' && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-gray-700">
                      utg.sheaf_ui_columns_base_foundation (for utg_id = "addressjar")
                    </label>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(sheafData);
                        alert('Columns data copied to clipboard!');
                      }}
                      disabled={sheafLoading || !sheafData}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      1 click copy
                    </button>
                  </div>
                  
                  <div className="flex-1 min-h-0">
                    <textarea
                      value={sheafLoading ? 'Loading...' : sheafData}
                      readOnly
                      className="w-full h-full p-4 border border-gray-300 rounded-md font-mono text-sm resize-none bg-gray-50 overflow-auto"
                      placeholder="Column data will appear here..."
                    />
                  </div>
                </>
              )}
              
              {/* Other tab contents */}
              {activeTab === 'rtab2' && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-gray-700">
                      Monolith of UI Columns (Text Format)
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={generateMonolithFromSheaf}
                        disabled={monolithLoading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {monolithLoading ? 'Generating...' : 'Generate Monolith from Current Sheaf'}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(monolithData);
                          alert('Monolith data copied to clipboard!');
                        }}
                        disabled={!monolithData}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        1 click copy
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-3">
                    <strong>NoteToSelf:</strong> must make this an admin only feature in the future
                  </p>
                  
                  <div className="flex-1 min-h-0">
                    <textarea
                      value={monolithData}
                      readOnly
                      className="w-full h-full p-4 border border-gray-300 rounded-md font-mono text-sm resize-none bg-gray-50 overflow-auto"
                      placeholder="Click 'Generate Monolith from Current Sheaf' to create column list..."
                    />
                  </div>
                </>
              )}
              
              {activeTab === 'rtab3' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-gray-700">
                      Column Templates (coltemps) for addressjar
                    </label>
                    <button
                      onClick={fetchColtempsData}
                      disabled={coltempsLoading}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {coltempsLoading ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                  
                  {coltempsError && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                      Error: {coltempsError}
                    </div>
                  )}
                  
                  <div className="flex-1 min-h-0 overflow-auto">
                    {coltempsLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <p className="text-gray-500">Loading coltemps data...</p>
                      </div>
                    ) : coltempsData.length === 0 ? (
                      <div className="flex items-center justify-center h-32">
                        <p className="text-gray-500">No column templates found for addressjar</p>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full border-collapse">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UTG</th>
                              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {coltempsData.map((coltemp, index) => (
                              <tr key={coltemp.coltemp_id || index} className="hover:bg-gray-50">
                                <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900">
                                  {coltemp.coltemp_id}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900 font-medium">
                                  {coltemp.coltemp_name || 'Unnamed'}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    coltemp.coltemp_category === 'adminpublic' 
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {coltemp.coltemp_category || 'user'}
                                  </span>
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900">
                                  {coltemp.fk_user_id === user?.id ? (
                                    <span className="text-blue-600 font-medium">You</span>
                                  ) : (
                                    <span className="text-gray-500">{coltemp.fk_user_id?.substring(0, 8)}...</span>
                                  )}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                  {coltemp.rel_utg_id}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                  {coltemp.created_at ? new Date(coltemp.created_at).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500 max-w-xs truncate">
                                  {coltemp.coltemp_description || 'No description'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 text-xs text-gray-500">
                    Showing {coltempsData.length} column templates for rel_utg_id = "utg_addressjar"
                  </div>
                </div>
              )}
              
              {activeTab === 'rtab4' && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-500">rtab4 content coming soon</p>
                </div>
              )}
              
              {activeTab === 'rtab5' && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-500">rtab5 content coming soon</p>
                </div>
              )}
              
              {activeTab === 'rtab6' && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-500">rtab6 content coming soon</p>
                </div>
              )}
              
              {activeTab === 'rtab7' && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-500">rtab7 content coming soon</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}