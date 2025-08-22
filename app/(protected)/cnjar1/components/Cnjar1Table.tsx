'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';
import { f355PopulateCncglub } from '../utils/f355-populate-cncglub';
import { f360DeleteAllCncglub } from '../utils/f360-delete-all-cncglub';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

interface Cncglub {
  cncg_id: number;
  rel_city_id: number;
  rel_industry_id: number;
  is_sko: boolean;
  created_at: string;
  updated_at: string | null;
  // Joined city data
  cities?: {
    city_name: string | null;
    state_code: string | null;
    state_full: string | null;
    country: string | null;
    rank_in_pop: number | null;
    gmaps_link: string | null;
    is_suburb: boolean | null;
    city_and_state_code: string | null;
    city_population: number | null;
    latitude: number | null;
    longitude: number | null;
    rel_metro_id: number | null;
    population_last_updated: string | null;
  } | null;
  // Joined industry data
  industries?: {
    industry_name: string | null;
    industry_description: string | null;
  } | null;
}

interface City {
  city_id: number;
  city_name: string | null;
  state_code: string | null;
}

interface Industry {
  industry_id: number;
  industry_name: string | null;
}

export default function Cnjar1Table() {
  const [data, setData] = useState<Cncglub[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<keyof Cncglub>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isF355ConfirmOpen, setIsF355ConfirmOpen] = useState(false);
  const [f355ConfirmStep, setF355ConfirmStep] = useState(1);
  const [isF355Running, setIsF355Running] = useState(false);
  const [f355Message, setF355Message] = useState('');
  
  // F360 Delete states
  const [isF360ConfirmOpen, setIsF360ConfirmOpen] = useState(false);
  const [f360ConfirmStep, setF360ConfirmStep] = useState(1);
  const [isF360Running, setIsF360Running] = useState(false);
  const [f360Message, setF360Message] = useState('');
  const [f360UserInput, setF360UserInput] = useState('');
  
  // Filter states
  const [citySizeFilter, setCitySizeFilter] = useState('all');
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Form data for creating
  const [formData, setFormData] = useState({
    rel_city_id: 0,
    rel_industry_id: 0
  });

  const supabase = createClientComponentClient();

  // Define columns
  const columns = [
    { key: 'cncg_id' as keyof Cncglub, label: 'cncg_id', type: 'number', readOnly: true },
    { key: 'rel_city_id' as keyof Cncglub, label: 'rel_city_id', type: 'number' },
    { key: 'rel_industry_id' as keyof Cncglub, label: 'rel_industry_id', type: 'number' },
    { key: 'is_sko' as keyof Cncglub, label: 'is_sko', type: 'boolean' },
    { key: 'created_at' as keyof Cncglub, label: 'created_at', type: 'datetime', readOnly: true },
    { key: 'updated_at' as keyof Cncglub, label: 'updated_at', type: 'datetime', readOnly: true, separator: 'black-3px' }
  ];

  // City columns from cityjar
  const cityColumns = [
    { key: 'cities.city_name', label: 'city_name', type: 'text', readOnly: true, isJoined: true },
    { key: 'cities.state_code', label: 'state_code', type: 'text', readOnly: true, isJoined: true },
    { key: 'cities.state_full', label: 'state_full', type: 'text', readOnly: true, isJoined: true },
    { key: 'cities.country', label: 'country', type: 'text', readOnly: true, isJoined: true },
    { key: 'cities.rank_in_pop', label: 'rank_in_pop', type: 'number', readOnly: true, isJoined: true },
    { key: 'cities.gmaps_link', label: 'gmaps_link', type: 'text', readOnly: true, isJoined: true, width: '100px' },
    { key: 'cities.is_suburb', label: 'is_suburb', type: 'boolean', readOnly: true, isJoined: true },
    { key: 'cities.city_and_state_code', label: 'city_and_state_code', type: 'text', readOnly: true, isJoined: true },
    { key: 'cities.city_population', label: 'city_population', type: 'number', readOnly: true, isJoined: true },
    { key: 'cities.latitude', label: 'latitude', type: 'number', readOnly: true, isJoined: true },
    { key: 'cities.longitude', label: 'longitude', type: 'number', readOnly: true, isJoined: true },
    { key: 'cities.rel_metro_id', label: 'rel_metro_id', type: 'number', readOnly: true, isJoined: true },
    { key: 'cities.population_last_updated', label: 'population_last_updated', type: 'datetime', readOnly: true, isJoined: true, separator: 'black-3px' }
  ];

  // Industry columns from indusjar
  const industryColumns = [
    { key: 'industries.industry_name', label: 'industry_name', type: 'text', readOnly: true, isJoined: true },
    { key: 'industries.industry_description', label: 'industry_description', type: 'text', readOnly: true, isJoined: true }
  ];

  // Combine all columns
  const allColumns = [...columns, ...cityColumns, ...industryColumns];

  // Fetch data from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch main data with joins
      const { data: cncglubData, error: cncglubError } = await supabase
        .from('cncglub')
        .select(`
          *,
          cities!rel_city_id (
            city_name, state_code, state_full, country, rank_in_pop, 
            gmaps_link, is_suburb, city_and_state_code, city_population, 
            latitude, longitude, rel_metro_id, population_last_updated
          ),
          industries!rel_industry_id (
            industry_name, industry_description
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50000); // Set explicit limit to handle up to 50k records

      if (cncglubError) throw cncglubError;
      
      // Fetch cities for reference (still needed for dropdowns)
      const { data: citiesData, error: citiesError } = await supabase
        .from('cities')
        .select('city_id, city_name, state_code')
        .order('city_name');
        
      if (citiesError) throw citiesError;
      
      // Fetch industries for reference (still needed for dropdowns)
      const { data: industriesData, error: industriesError } = await supabase
        .from('industries')
        .select('industry_id, industry_name')
        .order('industry_name');
        
      if (industriesError) throw industriesError;
      
      setData(cncglubData || []);
      setCities(citiesData || []);
      setIndustries(industriesData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper function to get city display name
  const getCityDisplay = (cityId: number) => {
    const city = cities.find(c => c.city_id === cityId);
    return city ? `${city.city_name}, ${city.state_code}` : `City ID: ${cityId}`;
  };

  // Helper function to get industry display name
  const getIndustryDisplay = (industryId: number) => {
    const industry = industries.find(i => i.industry_id === industryId);
    return industry ? industry.industry_name : `Industry ID: ${industryId}`;
  };

  // Helper function to get joined column value
  const getJoinedValue = (item: Cncglub, columnKey: string) => {
    const [table, field] = columnKey.split('.');
    if (table === 'cities' && item.cities) {
      return (item.cities as any)[field];
    }
    if (table === 'industries' && item.industries) {
      return (item.industries as any)[field];
    }
    return null;
  };

  // Helper function to check if cncglub record's related city population matches filter
  const matchesCitySizeFilter = (item: Cncglub) => {
    const cityPopulation = item.cities?.city_population;
    
    // If city size filter is 'all', show all records
    if (citySizeFilter === 'all') {
      return true;
    }
    
    // If no population data, exclude from specific size filters
    if (!cityPopulation) {
      return false;
    }
    
    // CONVERT TO NUMBER FIRST to handle string values from database
    const population = Number(cityPopulation);
    if (isNaN(population)) {
      console.log('Invalid population data for cncg_id:', item.cncg_id, 'cityPopulation:', cityPopulation);
      return false;
    }
    
    // Debug logging (can be removed once working)
    console.log('Debug matchesCitySizeFilter - cncg_id:', item.cncg_id, 'rel_city_id:', item.rel_city_id, 'originalPopulation:', cityPopulation, 'convertedPopulation:', population, 'citySizeFilter:', citySizeFilter);
    
    // Apply specific city size filters based on converted population number
    switch (citySizeFilter) {
      case 'under-25k':
        return population < 25000;
      case '25k-50k':
        return population >= 25000 && population < 50000;
      case '50k-100k':
        return population >= 50000 && population < 100000;
      case '100k-500k':
        return population >= 100000 && population < 500000;
      case '500k-plus':
        return population >= 500000;
      default:
        return true;
    }
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;
    
    console.log('Filter applied - citySizeFilter:', citySizeFilter);
    console.log('Original data length:', data.length);
    console.log('First few items structure:', data.slice(0, 3).map(item => ({
      cncg_id: item.cncg_id,
      rel_city_id: item.rel_city_id,
      cities: item.cities,
      city_population: item.cities?.city_population
    })));
    
    // Debug: Show population range
    const populations = data.map(item => item.cities?.city_population).filter(pop => pop !== null && pop !== undefined);
    const minPop = Math.min(...populations);
    const maxPop = Math.max(...populations);
    console.log('Population range:', { minPop, maxPop, totalCities: populations.length });
    
    // Apply city size filtering only if not 'all'
    if (citySizeFilter !== 'all') {
      console.log('Applying city size filter...');
      filtered = filtered.filter(item => matchesCitySizeFilter(item));
      console.log('Filtered data length after city size filter:', filtered.length);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        // Search in city and industry names
        const cityName = getCityDisplay(item.rel_city_id).toLowerCase();
        const industryName = getIndustryDisplay(item.rel_industry_id).toLowerCase();
        
        return (
          cityName.includes(searchLower) ||
          industryName.includes(searchLower) ||
          Object.values(item).some(value => 
            value && value.toString().toLowerCase().includes(searchLower)
          )
        );
      });
    }

    return filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortOrder === 'asc' ? -1 : 1;
      if (bValue === null) return sortOrder === 'asc' ? 1 : -1;
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, searchTerm, sortField, sortOrder, cities, industries, citySizeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage));
  const startIndex = (currentPage - 1) * (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage);
  const paginatedData = itemsPerPage === -1 ? filteredAndSortedData : filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  // Handle sorting
  const handleSort = (field: keyof Cncglub) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle cell editing
  const handleCellClick = (id: number, field: string, value: any) => {
    const column = columns.find(col => col.key === field);
    if (column?.readOnly) return;
    
    // Handle boolean columns specially
    if (column?.type === 'boolean') {
      handleBooleanToggle(id, field, value);
      return;
    }
    
    setEditingCell({ id, field });
    setEditingValue(value?.toString() || '');
  };

  // Handle boolean toggle
  const handleBooleanToggle = async (id: number, field: string, currentValue: boolean) => {
    try {
      const newValue = !currentValue;
      
      const { error } = await supabase
        .from('cncglub')
        .update({ [field]: newValue })
        .eq('cncg_id', id);

      if (error) throw error;

      // Update local data
      setData(data.map(item => 
        item.cncg_id === id 
          ? { ...item, [field]: newValue }
          : item
      ));
    } catch (err) {
      console.error('Error updating boolean field:', err);
      alert('Failed to update field');
    }
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    try {
      let processedValue: any = editingValue;

      // Process value based on type
      const column = columns.find(col => col.key === editingCell.field);
      if (column?.type === 'number') {
        processedValue = editingValue === '' ? null : Number(editingValue);
      } else if (column?.type === 'datetime') {
        processedValue = editingValue === '' ? null : editingValue;
      } else {
        processedValue = editingValue === '' ? null : editingValue;
      }

      const { error } = await supabase
        .from('cncglub')
        .update({ [editingCell.field]: processedValue })
        .eq('cncg_id', editingCell.id);

      if (error) throw error;

      // Update local data
      setData(data.map(item => 
        item.cncg_id === editingCell.id 
          ? { ...item, [editingCell.field]: processedValue }
          : item
      ));

      setEditingCell(null);
      setEditingValue('');
    } catch (err) {
      console.error('Error updating cell:', err);
      alert('Failed to update cell');
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  // Create new record inline
  const createNewRecordInline = async () => {
    try {
      // Get first city and industry as defaults
      const defaultCity = cities[0]?.city_id || 1;
      const defaultIndustry = industries[0]?.industry_id || 1;
      
      const newRecord = {
        rel_city_id: defaultCity,
        rel_industry_id: defaultIndustry
      };

      const { data: insertedData, error } = await supabase
        .from('cncglub')
        .insert([newRecord])
        .select()
        .single();

      if (error) throw error;

      // Add to local data at the beginning
      setData([insertedData, ...data]);
      
      // Set first editable cell to editing mode
      setEditingCell({ id: insertedData.cncg_id, field: 'rel_city_id' });
      setEditingValue(defaultCity.toString());
    } catch (err) {
      console.error('Error creating record:', err);
      alert('Failed to create record');
    }
  };

  // Handle popup form submission
  const handleCreateSubmit = async () => {
    try {
      const insertData = {
        rel_city_id: formData.rel_city_id || null,
        rel_industry_id: formData.rel_industry_id || null
      };
      
      const { data: insertedData, error } = await supabase
        .from('cncglub')
        .insert([insertData])
        .select()
        .single();
        
      if (error) throw error;
      
      setIsCreateModalOpen(false);
      resetForm();
      setData([insertedData, ...data]);
    } catch (err) {
      console.error('Error creating record:', err);
      alert(`Failed to create record: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      rel_city_id: 0,
      rel_industry_id: 0
    });
  };

  // F355 Populate function handlers
  const handleF355PopulateClick = () => {
    setIsF355ConfirmOpen(true);
    setF355ConfirmStep(1);
    setF355Message('');
  };

  const handleF355Confirm = async () => {
    if (f355ConfirmStep === 1) {
      setF355ConfirmStep(2);
      return;
    }
    
    // Step 2 confirmed, run the function
    setIsF355Running(true);
    setF355Message('');
    
    try {
      const result = await f355PopulateCncglub();
      
      if (result.success) {
        setF355Message(result.message);
        if (result.stats && result.stats.newCombos > 0) {
          // Refresh the data to show new records
          fetchData();
        }
      } else {
        setF355Message(`Error: ${result.message}`);
      }
    } catch (error) {
      setF355Message(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsF355Running(false);
    }
  };

  const handleF355Cancel = () => {
    setIsF355ConfirmOpen(false);
    setF355ConfirmStep(1);
    setF355Message('');
  };

  // F360 Delete function handlers
  const handleF360DeleteClick = () => {
    setIsF360ConfirmOpen(true);
    setF360ConfirmStep(1);
    setF360Message('');
    setF360UserInput('');
  };

  const handleF360Confirm = async () => {
    if (f360ConfirmStep === 1) {
      setF360ConfirmStep(2);
      return;
    }
    
    if (f360ConfirmStep === 2) {
      setF360ConfirmStep(3);
      return;
    }
    
    // Step 3 - check user input
    if (f360ConfirmStep === 3) {
      if (f360UserInput !== 'i confirm totally') {
        setF360Message('Incorrect confirmation text. Please type exactly: i confirm totally');
        return;
      }
      
      // Run the delete function
      setIsF360Running(true);
      setF360Message('');
      
      try {
        const result = await f360DeleteAllCncglub();
        
        if (result.success) {
          setF360Message(result.message);
          // Refresh the data to show empty table
          fetchData();
        } else {
          setF360Message(`Error: ${result.message}`);
        }
      } catch (error) {
        setF360Message(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsF360Running(false);
      }
    }
  };

  const handleF360Cancel = () => {
    setIsF360ConfirmOpen(false);
    setF360ConfirmStep(1);
    setF360Message('');
    setF360UserInput('');
  };

  // Render cell content with special handling for foreign keys
  const renderCell = (item: Cncglub, column: any) => {
    let value: any;
    
    // Handle joined columns
    if (column.isJoined) {
      value = getJoinedValue(item, column.key);
    } else {
      value = item[column.key as keyof Cncglub];
    }
    
    const isEditing = editingCell?.id === item.cncg_id && editingCell?.field === column.key;
    const isReadOnly = column.readOnly;

    if (isEditing && !column.isJoined) {
      return (
        <div className="flex items-center space-x-2">
          {column.key === 'rel_city_id' ? (
            <select
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={handleCellSave}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCellSave();
                if (e.key === 'Escape') handleCellCancel();
              }}
              className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none"
              autoFocus
            >
              {cities.map(city => (
                <option key={city.city_id} value={city.city_id}>
                  {city.city_name}, {city.state_code}
                </option>
              ))}
            </select>
          ) : column.key === 'rel_industry_id' ? (
            <select
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={handleCellSave}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCellSave();
                if (e.key === 'Escape') handleCellCancel();
              }}
              className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none"
              autoFocus
            >
              {industries.map(industry => (
                <option key={industry.industry_id} value={industry.industry_id}>
                  {industry.industry_name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={column.type === 'number' ? 'number' : 'text'}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCellSave();
                if (e.key === 'Escape') handleCellCancel();
              }}
              className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none"
              autoFocus
            />
          )}
          <button onClick={handleCellSave} className="text-green-600 hover:text-green-800">
            ✓
          </button>
          <button onClick={handleCellCancel} className="text-red-600 hover:text-red-800">
            ✗
          </button>
        </div>
      );
    }

    // Special display for foreign keys
    if (column.key === 'rel_city_id') {
      return (
        <div
          onClick={() => !isReadOnly && handleCellClick(item.cncg_id, column.key, value)}
          className={`cursor-pointer hover:bg-gray-100 px-2 py-1 ${!isReadOnly ? 'cursor-text' : 'cursor-default'}`}
        >
          {getCityDisplay(value as number)}
        </div>
      );
    }

    if (column.key === 'rel_industry_id') {
      return (
        <div
          onClick={() => !isReadOnly && handleCellClick(item.cncg_id, column.key, value)}
          className={`cursor-pointer hover:bg-gray-100 px-2 py-1 ${!isReadOnly ? 'cursor-text' : 'cursor-default'}`}
        >
          {getIndustryDisplay(value as number)}
        </div>
      );
    }

    // Special handling for joined gmaps_link column
    if (column.key === 'cities.gmaps_link' && value) {
      return (
        <div className="flex items-center space-x-1" style={{ width: '100px', maxWidth: '100px', minWidth: '100px' }}>
          <button onClick={async (e) => {
            e.stopPropagation();
            if (value) {
              try {
                await navigator.clipboard.writeText(value.toString());
              } catch (err) {
                console.error('Failed to copy to clipboard:', err);
              }
            }
          }}
          className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-bold flex items-center justify-center"
          title="Copy to clipboard">
            📋
          </button>
          <button onClick={(e) => {
            e.stopPropagation();
            if (value) {
              window.open(value.toString(), '_blank');
            }
          }}
          className="w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-bold flex items-center justify-center"
          title="Open in new tab">
            OP
          </button>
          <div className="flex-1 overflow-hidden">
            <textarea
              value={value?.toString() || ''}
              readOnly
              className="w-full text-xs border-none resize-none bg-transparent overflow-hidden"
              style={{ height: '20px', width: '46px' }}
            />
          </div>
        </div>
      );
    }

    return (
      <div
        onClick={() => !isReadOnly && !column.isJoined && handleCellClick(item.cncg_id, column.key, value)}
        className={`px-2 py-1 ${!isReadOnly && !column.isJoined ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'} ${column.type === 'boolean' ? 'cursor-pointer' : 'cursor-text'}`}
      >
        {column.type === 'boolean' ? 
          (value ? '✓' : '✗') :
          column.type === 'datetime' && value ? 
            new Date(value).toLocaleString() : 
            value?.toString() || ''
        }
      </div>
    );
  };

  // Pagination Controls Component
  const PaginationControls = () => (
    <div className="flex items-center space-x-4">
      {/* Items per page */}
      <div className="flex items-center">
        <span className="text-sm text-gray-600 mr-2">Per page:</span>
        <div className="inline-flex" role="group">
          {[10, 20, 50, 100, 200, 500, -1].map((value, index) => (
            <button
              key={value}
              onClick={() => {
                setItemsPerPage(value === -1 ? filteredAndSortedData.length : value);
                setCurrentPage(1);
              }}
              className={`
                px-3 py-2 text-sm font-medium border border-gray-300
                ${itemsPerPage === (value === -1 ? filteredAndSortedData.length : value) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-100'}
                ${index === 0 ? 'rounded-l-md' : ''}
                ${index === 6 ? 'rounded-r-md' : ''}
                ${index > 0 ? 'border-l-0' : ''}
                transition-colors duration-150 cursor-pointer
              `}
              style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
            >
              {value === -1 ? 'All' : value}
            </button>
          ))}
        </div>
      </div>

      {/* Page navigation */}
      <div className="flex items-center">
        <span className="text-sm text-gray-600 mr-2">Page:</span>
        <div className="inline-flex" role="group">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`
              px-3 py-2 text-sm font-medium border border-gray-300 rounded-l-md
              ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 cursor-pointer'}
              transition-colors duration-150
            `}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            ←
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`
                  px-3 py-2 text-sm font-medium border border-gray-300 border-l-0
                  ${currentPage === pageNum ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-100'}
                  transition-colors duration-150 cursor-pointer
                `}
                style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`
              px-3 py-2 text-sm font-medium border border-gray-300 border-l-0 rounded-r-md
              ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 cursor-pointer'}
              transition-colors duration-150
            `}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading city-industry combinations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* City Size Filter */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <label className="font-bold text-sm text-gray-700">Filter by City Population:</label>
            <select
              value={citySizeFilter}
              onChange={(e) => {
                setCitySizeFilter(e.target.value);
                setCurrentPage(1); // Reset to first page when filtering
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Records</option>
              <option value="under-25k">Under 25k</option>
              <option value="25k-50k">25k - 50k</option>
              <option value="50k-100k">50k - 100k</option>
              <option value="100k-500k">100k - 500k</option>
              <option value="500k-plus">500k+</option>
            </select>
          </div>
          
          {/* Debug info */}
          <div className="text-xs text-gray-500">
            Debug: {data.length} total, {filteredAndSortedData.length} filtered
          </div>
        </div>
      </div>

      {/* Top Header Area */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 border-t-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <NubraTablefaceKite tableType="cncglub-grid" />
            <button
              onClick={handleF355PopulateClick}
              disabled={isF355Running}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium px-3 py-2 rounded-md text-sm transition-colors flex items-center space-x-2"
            >
              {isF355Running ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Running...</span>
                </>
              ) : (
                <span>f355 populate cncglub</span>
              )}
            </button>
            <button
              onClick={handleF360DeleteClick}
              disabled={isF360Running}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium px-3 py-2 rounded-md text-sm transition-colors flex items-center space-x-2"
            >
              {isF360Running ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <span>f360 delete all cncglub records</span>
              )}
            </button>
            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(startIndex + (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage), filteredAndSortedData.length)} of {filteredAndSortedData.length} records
              {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
            </div>
            <PaginationControls />
            <div className="relative">
              <input
                type="text"
                placeholder="Search all fields..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-80 px-3 py-2 pr-12 border border-gray-300 rounded-md text-sm"
              />
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-yellow-400 hover:bg-yellow-500 text-black px-2 py-1 rounded text-xs font-medium"
              >
                CL
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={createNewRecordInline}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-2 rounded-md text-sm transition-colors"
            >
              Create New (Inline)
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2 rounded-md text-sm transition-colors"
            >
              Create New (Popup)
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead className="bg-gray-50">
              {/* Additional blank header row */}
              <tr>
                <th className="px-2 py-1 text-left border border-gray-200" style={{ width: '50px' }}>
                  {/* Blank cell corresponding to checkbox column */}
                </th>
                {allColumns.map((column, index) => {
                  let bgColorClass = '';
                  let tableText = '';
                  
                  if (column.isJoined) {
                    if (column.key.startsWith('cities.')) {
                      bgColorClass = 'bg-[#bff8e8]';
                      tableText = 'cities';
                    } else if (column.key.startsWith('industries.')) {
                      bgColorClass = 'bg-[#f8ebbf]';
                      tableText = 'industries';
                    }
                  } else {
                    bgColorClass = 'bg-[#f6bff8]';
                    tableText = 'cncglub';
                  }
                  
                  return (
                    <th
                      key={`blank-${column.key}`}
                      className={`text-left border border-gray-200 px-2 py-1 ${bgColorClass} ${
                        column.separator === 'black-3px' ? 'border-r-black border-r-[3px]' : ''
                      }`}
                    >
                      <span className="text-xs font-normal text-gray-600">{tableText}</span>
                    </th>
                  );
                })}
              </tr>
              {/* Primary identifying row for columns */}
              <tr>
                <th className="px-2 py-3 text-left border border-gray-200" style={{ width: '50px' }}>
                  <div 
                    className="w-full h-full flex items-center justify-center cursor-pointer"
                    onClick={() => {
                      if (selectedRows.size === paginatedData.length && paginatedData.length > 0) {
                        setSelectedRows(new Set());
                      } else {
                        setSelectedRows(new Set(paginatedData.map(item => item.cncg_id)));
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{ width: '20px', height: '20px' }}
                      checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                      onChange={() => {}} // Handled by div onClick
                    />
                  </div>
                </th>
                {allColumns.map((column) => (
                  <th
                    key={column.key}
                    className={`text-left ${!column.isJoined ? 'cursor-pointer hover:bg-gray-100' : ''} border border-gray-200 px-2 py-1 ${
                      column.separator === 'black-3px' ? 'border-r-black border-r-[3px]' : ''
                    }`}
                    onClick={() => !column.isJoined && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-xs lowercase">{column.label}</span>
                      {!column.isJoined && sortField === column.key && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {paginatedData.map((item) => (
                <tr key={item.cncg_id} className="hover:bg-gray-50">
                  <td className="px-2 py-1 border border-gray-200">
                    <div 
                      className="w-full h-full flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        const newSelected = new Set(selectedRows);
                        if (newSelected.has(item.cncg_id)) {
                          newSelected.delete(item.cncg_id);
                        } else {
                          newSelected.add(item.cncg_id);
                        }
                        setSelectedRows(newSelected);
                      }}
                    >
                      <input
                        type="checkbox"
                        style={{ width: '20px', height: '20px' }}
                        checked={selectedRows.has(item.cncg_id)}
                        onChange={() => {}} // Handled by div onClick
                      />
                    </div>
                  </td>
                  {allColumns.map((column) => (
                    <td 
                      key={column.key} 
                      className={`border border-gray-200 ${
                        column.separator === 'black-3px' ? 'border-r-black border-r-[3px]' : ''
                      }`}
                    >
                      {renderCell(item, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Pagination */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(startIndex + (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage), filteredAndSortedData.length)} of {filteredAndSortedData.length} records
              {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
            </div>
            <PaginationControls />
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New City-Industry Combination</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <select
                  value={formData.rel_city_id}
                  onChange={(e) => setFormData({ ...formData, rel_city_id: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={0}>Select a city...</option>
                  {cities.map(city => (
                    <option key={city.city_id} value={city.city_id}>
                      {city.city_name}, {city.state_code}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select
                  value={formData.rel_industry_id}
                  onChange={(e) => setFormData({ ...formData, rel_industry_id: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={0}>Select an industry...</option>
                  {industries.map(industry => (
                    <option key={industry.industry_id} value={industry.industry_id}>
                      {industry.industry_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Create Combination
              </button>
            </div>
          </div>
        </div>
      )}

      {/* F355 Double Confirmation Modal */}
      {isF355ConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-purple-700">
              F355 Populate All City-Industry Combinations
            </h2>
            
            {f355ConfirmStep === 1 && (
              <>
                <div className="mb-6">
                  <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">First Confirmation</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>This will create a new row in cncglub for EVERY combination of cities and industries that doesn't already exist.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    This action will:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                    <li>Fetch all cities from the cities table</li>
                    <li>Fetch all industries from the industries table</li>
                    <li>Create combinations for all cities × all industries</li>
                    <li>Skip combinations that already exist in cncglub</li>
                    <li>Insert all missing combinations into cncglub table</li>
                  </ul>
                  <p className="text-sm text-gray-500">
                    Are you sure you want to proceed? This is the first confirmation.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleF355Cancel}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleF355Confirm}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    Confirm (Step 1)
                  </button>
                </div>
              </>
            )}
            
            {f355ConfirmStep === 2 && (
              <>
                <div className="mb-6">
                  <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Final Confirmation</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p><strong>WARNING:</strong> This action cannot be undone!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-800 font-semibold mb-4">
                    This is your FINAL confirmation. Are you absolutely sure?
                  </p>
                  <div className="bg-gray-100 p-3 rounded text-sm text-gray-600">
                    <p>The F355 populate function will run and may create thousands of new records. This could take several seconds to complete.</p>
                  </div>
                  {isF355Running && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span className="text-blue-700">Running F355 populate function...</span>
                      </div>
                    </div>
                  )}
                  {f355Message && (
                    <div className={`mt-4 p-4 rounded ${f355Message.includes('Error') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                      {f355Message}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleF355Cancel}
                    disabled={isF355Running}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleF355Confirm}
                    disabled={isF355Running}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-400 transition-colors flex items-center space-x-2"
                  >
                    {isF355Running ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Running...</span>
                      </>
                    ) : (
                      <span>RUN F355 POPULATE</span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* F360 Triple Confirmation Modal */}
      {isF360ConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-red-700">
              F360 DELETE ALL CNCGLUB RECORDS
            </h2>
            
            {f360ConfirmStep === 1 && (
              <>
                <div className="mb-6">
                  <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">⚠️ FIRST WARNING ⚠️</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>This will DELETE ALL records from the cncglub table!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-800 font-semibold mb-4">
                    This action will permanently delete ALL cncglub records.
                  </p>
                  <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                    <li>All city-industry combinations will be removed</li>
                    <li>This cannot be undone</li>
                    <li>You will need to run f355 to repopulate data</li>
                  </ul>
                  <p className="text-sm text-red-600 font-bold">
                    Are you absolutely sure you want to proceed?
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleF360Cancel}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleF360Confirm}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Continue (Warning 1 of 3)
                  </button>
                </div>
              </>
            )}
            
            {f360ConfirmStep === 2 && (
              <>
                <div className="mb-6">
                  <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">⚠️⚠️ SECOND WARNING ⚠️⚠️</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p><strong>THIS IS DESTRUCTIVE AND IRREVERSIBLE!</strong></p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-red-800 font-bold text-lg mb-4">
                    FINAL CHANCE TO CANCEL!
                  </p>
                  <div className="bg-gray-100 p-3 rounded text-sm text-gray-800">
                    <p className="font-semibold mb-2">This will:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Delete {data.length} records currently in memory</li>
                      <li>Delete ALL records from the database table</li>
                      <li>Leave the cncglub table completely empty</li>
                    </ul>
                  </div>
                  <p className="text-red-600 font-bold mt-4">
                    Do you REALLY want to delete everything?
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleF360Cancel}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleF360Confirm}
                    className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 transition-colors"
                  >
                    Continue (Warning 2 of 3)
                  </button>
                </div>
              </>
            )}
            
            {f360ConfirmStep === 3 && (
              <>
                <div className="mb-6">
                  <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">⚠️⚠️⚠️ FINAL WARNING ⚠️⚠️⚠️</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p><strong>TYPE THE CONFIRMATION TEXT TO PROCEED</strong></p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-800 font-semibold mb-4">
                    To confirm deletion of ALL cncglub records, please type:
                  </p>
                  
                  {/* Non-copyable text display */}
                  <div className="bg-gray-200 p-4 rounded mb-4 select-none relative">
                    <div 
                      className="font-mono text-lg font-bold text-gray-800"
                      style={{
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none'
                      }}
                      onCopy={(e) => e.preventDefault()}
                      onCut={(e) => e.preventDefault()}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      {/* Display as individual spans to make copying harder */}
                      <span>i</span><span> </span><span>c</span><span>o</span><span>n</span><span>f</span><span>i</span><span>r</span><span>m</span>
                      <span> </span><span>t</span><span>o</span><span>t</span><span>a</span><span>l</span><span>l</span><span>y</span>
                    </div>
                    {/* Overlay to prevent selection */}
                    <div className="absolute inset-0" style={{ zIndex: 1 }}></div>
                  </div>
                  
                  <input
                    type="text"
                    value={f360UserInput}
                    onChange={(e) => setF360UserInput(e.target.value)}
                    placeholder="Type the confirmation text here"
                    className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    autoComplete="off"
                  />
                  
                  {f360Message && (
                    <div className={`mt-4 p-4 rounded ${f360Message.includes('Error') || f360Message.includes('Incorrect') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                      {f360Message}
                    </div>
                  )}
                  
                  {isF360Running && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                        <span className="text-red-700">Deleting all records...</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleF360Cancel}
                    disabled={isF360Running}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleF360Confirm}
                    disabled={isF360Running}
                    className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-900 disabled:bg-red-400 transition-colors flex items-center space-x-2"
                  >
                    {isF360Running ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <span>DELETE ALL RECORDS</span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}