'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import BensaFieldTable from '@/app/(protected3)/bensa/components/BensaFieldTable';
import { bensaUtgsConfig } from '@/app/(protected3)/bensa/config/bensaUtgsConfig';
import { bensaZarnosConfig } from '@/app/(protected3)/bensa/config/bensaZarnosConfig';

interface XPage {
  xpage_id: number;
  title1: string | null;
  main_url: string | null;
  meta_title: string | null;
  title2: string | null;
  desc1: string | null;
  caption: string | null;
  pagepath_url: string | null;
  pagepath_long: string | null;
  pagepath_short: string | null;
  position_marker: number | null;
  show_in_all_pages_nav_area1: boolean | null;
  broad_parent_container: string | null;
  created_at: string;
  updated_at: string;
}

interface UTG {
  utg_id: string;
  utg_name: string;
  rel_xpage_id: number | null;
}

interface Zarno {
  zarno_id: number;
  fk_xpage_id: number | null;
  zarno_name: string | null;
  zarno_type: string | null;
  zarno_path: string | null;
  zarno_status: string | null;
  zarno_config: any;
  execution_order: number | null;
  dependencies: any;
  metadata: any;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface ZarnoDropdownItem {
  zarno_id: number;
  zarno_name: string | null;
  fk_xpage_id: number | null;
}

export default function AzoPage() {
  const [activeTab, setActiveTab] = useState<'xpages' | 'utgs' | 'zarnos'>('xpages');
  const [xpages, setXpages] = useState<XPage[]>([]);
  const [utgs, setUtgs] = useState<UTG[]>([]);
  const [zarnos, setZarnos] = useState<ZarnoDropdownItem[]>([]);
  const [selectedXpage, setSelectedXpage] = useState<XPage | null>(null);
  const [selectedXpageId, setSelectedXpageId] = useState<number | null>(null);
  const [selectedUtgId, setSelectedUtgId] = useState<string | null>(null);
  const [selectedUtgRecord, setSelectedUtgRecord] = useState<any | null>(null);
  const [selectedZarnoId, setSelectedZarnoId] = useState<number | null>(null);
  const [selectedZarnoRecord, setSelectedZarnoRecord] = useState<Zarno | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUtgs, setLoadingUtgs] = useState(false);
  const [loadingZarnos, setLoadingZarnos] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [fieldMetadata, setFieldMetadata] = useState<{[key: string]: {starred: boolean, flagged: boolean}}>({});
  const [sortBy, setSortBy] = useState<string>('field_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  // Initialize page - only run once
  useEffect(() => {
    document.title = 'Azo Page Settings Manager';
    fetchXpages();
    fetchFieldMetadata();
  }, []);

  // Handle URL parameters - only when searchParams change
  useEffect(() => {
    if (!searchParams) return;
    
    // Get tab from URL if present
    const tabParam = searchParams.get('tab');
    if (tabParam && (tabParam === 'xpages' || tabParam === 'utgs' || tabParam === 'zarnos')) {
      setActiveTab(tabParam as 'xpages' | 'utgs' | 'zarnos');
    }
    
    // Get xpage_id from URL if present
    const xpageIdParam = searchParams.get('xpage_id');
    if (xpageIdParam) {
      const xpageId = parseInt(xpageIdParam);
      setSelectedXpageId(xpageId);
      fetchSelectedXpage(xpageId);
    }
    
    // Get utg_id from URL if present
    const utgIdParam = searchParams.get('utg_id');
    if (utgIdParam) {
      setSelectedUtgId(utgIdParam);
      fetchSelectedUtg(utgIdParam);
    }
    
    // Get zarno_id from URL if present
    const zarnoIdParam = searchParams.get('zarno_id');
    if (zarnoIdParam) {
      const zarnoId = parseInt(zarnoIdParam);
      setSelectedZarnoId(zarnoId);
      fetchSelectedZarno(zarnoId);
    }
  }, [searchParams]);

  // Fetch UTGs when xpage is selected
  useEffect(() => {
    if (selectedXpageId) {
      fetchRelatedUtgs(selectedXpageId);
    } else {
      setUtgs([]);
      setSelectedUtgId(null);
      setSelectedUtgRecord(null);
    }
  }, [selectedXpageId]);

  // Fetch Zarnos when xpage is selected
  useEffect(() => {
    if (selectedXpageId) {
      fetchRelatedZarnos(selectedXpageId);
    } else {
      setZarnos([]);
      setSelectedZarnoId(null);
      setSelectedZarnoRecord(null);
    }
  }, [selectedXpageId]);

  const fetchXpages = async () => {
    try {
      const { data, error } = await supabase
        .from('xpages')
        .select('*')
        .order('xpage_id', { ascending: true });

      if (error) {
        console.error('Error fetching xpages:', error);
        return;
      }

      setXpages(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedXpage = async (xpageId: number) => {
    try {
      const { data, error } = await supabase
        .from('xpages')
        .select('*')
        .eq('xpage_id', xpageId)
        .single();

      if (error) {
        console.error('Error fetching selected xpage:', error);
        return;
      }

      setSelectedXpage(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchSelectedUtg = async (utgId: string) => {
    try {
      const { data, error } = await supabase
        .from('utgs')
        .select('*')
        .eq('utg_id', utgId)
        .single();

      if (error) {
        console.error('Error fetching selected utg:', error);
        return;
      }

      setSelectedUtgRecord(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchFieldMetadata = async () => {
    try {
      const { data, error } = await supabase
        .from('frenzi_field_metadata')
        .select('field_name, starred, flagged')
        .eq('table_name', 'xpages');

      if (error) {
        console.error('Error fetching field metadata:', error);
        return;
      }

      const metadataMap: {[key: string]: {starred: boolean, flagged: boolean}} = {};
      data?.forEach(item => {
        metadataMap[item.field_name] = {
          starred: item.starred || false,
          flagged: item.flagged || false
        };
      });
      setFieldMetadata(metadataMap);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchRelatedUtgs = async (xpageId: number) => {
    try {
      setLoadingUtgs(true);
      
      // Fetch UTGs where rel_xpage_id matches the selected xpage_id
      const { data, error } = await supabase
        .from('utgs')
        .select('utg_id, utg_name, rel_xpage_id')
        .eq('rel_xpage_id', xpageId)
        .order('utg_name', { ascending: true });

      if (error) {
        console.error('Error fetching UTGs:', error);
        return;
      }

      setUtgs(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingUtgs(false);
    }
  };

  const fetchSelectedZarno = async (zarnoId: number) => {
    try {
      const { data, error } = await supabase
        .from('zarnos')
        .select('*')
        .eq('zarno_id', zarnoId)
        .single();

      if (error) {
        console.error('Error fetching selected zarno:', error);
        return;
      }

      setSelectedZarnoRecord(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchRelatedZarnos = async (xpageId: number) => {
    try {
      setLoadingZarnos(true);
      
      // Fetch Zarnos where fk_xpage_id matches the selected xpage_id
      const { data, error } = await supabase
        .from('zarnos')
        .select('zarno_id, zarno_name, fk_xpage_id')
        .eq('fk_xpage_id', xpageId)
        .order('zarno_name', { ascending: true });

      if (error) {
        console.error('Error fetching Zarnos:', error);
        return;
      }

      setZarnos(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingZarnos(false);
    }
  };

  const updateURLWithCurrentState = (updates: {
    tab?: 'xpages' | 'utgs' | 'zarnos';
    xpage_id?: number;
    utg_id?: string;
    zarno_id?: number;
  }) => {
    const params = new URLSearchParams(searchParams || '');
    
    // Update or set tab
    if (updates.tab) {
      params.set('tab', updates.tab);
    }
    
    // Update or set xpage_id
    if (updates.xpage_id !== undefined) {
      params.set('xpage_id', updates.xpage_id.toString());
    }
    
    // Update or set utg_id
    if (updates.utg_id !== undefined) {
      if (updates.utg_id) {
        params.set('utg_id', updates.utg_id);
      } else {
        params.delete('utg_id');
      }
    }
    
    // Update or set zarno_id
    if (updates.zarno_id !== undefined) {
      if (updates.zarno_id) {
        params.set('zarno_id', updates.zarno_id.toString());
      } else {
        params.delete('zarno_id');
      }
    }
    
    router.push(`/admin/azo?${params.toString()}`);
  };

  const handleXpageChange = (xpageId: number) => {
    setSelectedXpageId(xpageId);
    fetchSelectedXpage(xpageId);
    // Reset selected UTG and Zarno when XPage changes
    setSelectedUtgId(null);
    setSelectedUtgRecord(null);
    setSelectedZarnoId(null);
    setSelectedZarnoRecord(null);
    updateURLWithCurrentState({ xpage_id: xpageId, utg_id: '', zarno_id: 0 });
  };

  const handleUtgChange = (utgId: string) => {
    setSelectedUtgId(utgId);
    if (utgId) {
      fetchSelectedUtg(utgId);
    } else {
      setSelectedUtgRecord(null);
    }
    updateURLWithCurrentState({ utg_id: utgId });
  };

  const handleZarnoChange = (zarnoId: number) => {
    const validZarnoId = zarnoId > 0 ? zarnoId : null;
    setSelectedZarnoId(validZarnoId);
    if (validZarnoId) {
      fetchSelectedZarno(validZarnoId);
    } else {
      setSelectedZarnoRecord(null);
    }
    updateURLWithCurrentState({ zarno_id: validZarnoId || 0 });
  };

  const copyTooltipText = () => {
    const text = 'All rows from utgs where rel_xpage_id matches xpages.xpage_id';
    navigator.clipboard.writeText(text);
  };

  // Define field properties for xpages table
  const xpageFields = [
    { key: 'xpage_id', type: 'integer', editable: false },
    { key: 'title1', type: 'text', editable: true },
    { key: 'main_url', type: 'text', editable: true },
    { key: 'meta_title', type: 'text', editable: true },
    { key: 'title2', type: 'text', editable: true },
    { key: 'desc1', type: 'text', editable: true },
    { key: 'caption', type: 'text', editable: true },
    { key: 'pagepath_url', type: 'text', editable: true },
    { key: 'pagepath_long', type: 'text', editable: true },
    { key: 'pagepath_short', type: 'text', editable: true },
    { key: 'position_marker', type: 'integer', editable: true },
    { key: 'show_in_all_pages_nav_area1', type: 'boolean', editable: true },
    { key: 'broad_parent_container', type: 'text', editable: true },
    { key: 'created_at', type: 'timestamp', editable: false },
    { key: 'updated_at', type: 'timestamp', editable: false }
  ];

  const updateXpageField = async (field: string, value: any) => {
    if (!selectedXpageId) return;

    try {
      const { error } = await supabase
        .from('xpages')
        .update({ [field]: value })
        .eq('xpage_id', selectedXpageId);

      if (error) {
        console.error('Error updating field:', error);
        return;
      }

      // Update local state
      setSelectedXpage((prev: XPage | null) => prev ? { ...prev, [field]: value } : null);
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  const handleFieldClick = (field: string, currentValue: any) => {
    const fieldConfig = xpageFields.find(f => f.key === field);
    if (!fieldConfig?.editable) return;

    setEditingField(field);
    setEditingValue(currentValue?.toString() || '');
  };

  const handleFieldSave = async () => {
    if (!editingField) return;

    const fieldConfig = xpageFields.find(f => f.key === editingField);
    let processedValue: any = editingValue;

    if (fieldConfig?.type === 'integer') {
      processedValue = editingValue === '' ? null : parseInt(editingValue);
      if (isNaN(processedValue)) processedValue = null;
    } else if (fieldConfig?.type === 'boolean') {
      processedValue = editingValue === 'true';
    } else if (editingValue === '') {
      processedValue = null;
    }

    await updateXpageField(editingField, processedValue);
    setEditingField(null);
    setEditingValue('');
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setEditingValue('');
  };

  const handleBooleanToggle = async (field: string, currentValue: boolean | null) => {
    const newValue = currentValue === null ? true : !currentValue;
    await updateXpageField(field, newValue);
  };

  const handleFieldCheckboxChange = (field: string, checked: boolean) => {
    const newSelected = new Set(selectedFields);
    if (checked) {
      newSelected.add(field);
    } else {
      newSelected.delete(field);
    }
    setSelectedFields(newSelected);
  };

  const handleSelectAllFields = (checked: boolean) => {
    if (checked) {
      setSelectedFields(new Set(xpageFields.map(f => f.key)));
    } else {
      setSelectedFields(new Set());
    }
  };

  const handleUtgUpdate = async (field: string, value: any) => {
    if (!selectedUtgId) return;

    try {
      const { error } = await supabase
        .from('utgs')
        .update({ [field]: value })
        .eq('utg_id', selectedUtgId);

      if (error) {
        console.error('Error updating utg field:', error);
        return;
      }

      // Update local state
      setSelectedUtgRecord((prev: any) => prev ? { ...prev, [field]: value } : null);
    } catch (error) {
      console.error('Error updating utg field:', error);
    }
  };

  const handleZarnoUpdate = async (field: string, value: any) => {
    if (!selectedZarnoId) return;

    try {
      const { error } = await supabase
        .from('zarnos')
        .update({ [field]: value })
        .eq('zarno_id', selectedZarnoId);

      if (error) {
        console.error('Error updating zarno field:', error);
        return;
      }

      // Update local state
      setSelectedZarnoRecord((prev: Zarno | null) => prev ? { ...prev, [field]: value } : null);
    } catch (error) {
      console.error('Error updating zarno field:', error);
    }
  };

  const toggleFieldStar = async (fieldName: string) => {
    const currentStarred = fieldMetadata[fieldName]?.starred || false;
    const newStarred = !currentStarred;

    try {
      const { error } = await supabase
        .from('frenzi_field_metadata')
        .upsert({
          table_name: 'xpages',
          field_name: fieldName,
          starred: newStarred,
          flagged: fieldMetadata[fieldName]?.flagged || false
        }, {
          onConflict: 'table_name,field_name'
        });

      if (error) {
        console.error('Error updating field star:', error);
        return;
      }

      // Update local state
      setFieldMetadata(prev => ({
        ...prev,
        [fieldName]: {
          starred: newStarred,
          flagged: prev[fieldName]?.flagged || false
        }
      }));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleFieldFlag = async (fieldName: string) => {
    const currentFlagged = fieldMetadata[fieldName]?.flagged || false;
    const newFlagged = !currentFlagged;

    try {
      const { error } = await supabase
        .from('frenzi_field_metadata')
        .upsert({
          table_name: 'xpages',
          field_name: fieldName,
          starred: fieldMetadata[fieldName]?.starred || false,
          flagged: newFlagged
        }, {
          onConflict: 'table_name,field_name'
        });

      if (error) {
        console.error('Error updating field flag:', error);
        return;
      }

      // Update local state
      setFieldMetadata(prev => ({
        ...prev,
        [fieldName]: {
          starred: prev[fieldName]?.starred || false,
          flagged: newFlagged
        }
      }));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Handle column header click for sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // Sort fields based on selected sort option
  const getSortedFields = () => {
    const fieldsWithMetadata = xpageFields.map(field => ({
      ...field,
      starred: fieldMetadata[field.key]?.starred || false,
      flagged: fieldMetadata[field.key]?.flagged || false,
      value: selectedXpage ? selectedXpage[field.key as keyof XPage] : null
    }));

    return fieldsWithMetadata.sort((a, b) => {
      let compareResult = 0;

      switch (sortBy) {
        case 'starred':
          compareResult = (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
          break;
        case 'flagged':
          compareResult = (b.flagged ? 1 : 0) - (a.flagged ? 1 : 0);
          break;
        case 'field_name':
          compareResult = a.key.localeCompare(b.key);
          break;
        case 'value':
          const aVal = a.value?.toString() || '';
          const bVal = b.value?.toString() || '';
          compareResult = aVal.localeCompare(bVal);
          break;
        default:
          compareResult = 0;
      }

      return sortDirection === 'asc' ? compareResult : -compareResult;
    });
  };

  const dropdownContainerStyle = {
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  const labelStyle = {
    fontSize: '14px',
    fontWeight: '600'
  };

  const selectStyle = {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#fff',
    minWidth: '300px',
    cursor: 'pointer'
  };

  const disabledSelectStyle = {
    ...selectStyle,
    backgroundColor: '#f5f5f5',
    cursor: 'not-allowed',
    opacity: 0.6
  };

  const tooltipContainerStyle = {
    position: 'relative' as const,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px'
  };

  const tooltipIconStyle = {
    cursor: 'help',
    fontSize: '16px',
    color: '#666'
  };

  const tooltipBoxStyle = {
    position: 'absolute' as const,
    top: '100%',
    left: '0',
    marginTop: '5px',
    padding: '10px',
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: '4px',
    fontSize: '12px',
    whiteSpace: 'nowrap' as const,
    zIndex: 1000,
    display: showTooltip ? 'flex' : 'none',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
  };

  const copyButtonStyle = {
    padding: '2px 8px',
    backgroundColor: '#555',
    border: 'none',
    borderRadius: '3px',
    color: '#fff',
    fontSize: '11px',
    cursor: 'pointer'
  };

  const tabContainerStyle = {
    width: '100%',
    borderBottom: '2px solid #ddd',
    marginBottom: '20px'
  };

  const tabListStyle = {
    display: 'flex',
    width: '100%',
    margin: '0',
    padding: '0',
    listStyle: 'none'
  };

  const tabStyle = {
    flex: '1',
    textAlign: 'center' as const,
    padding: '12px 16px',
    cursor: 'pointer',
    border: '1px solid #ddd',
    borderBottom: 'none',
    backgroundColor: '#f8f9fa',
    fontSize: '14px',
    fontWeight: '500'
  };

  const activeTabStyle = {
    ...tabStyle,
    backgroundColor: '#fff',
    borderBottom: '2px solid #fff',
    borderTop: '2px solid #ba5816',
    borderLeft: '2px solid #ba5816',
    borderRight: '2px solid #ba5816',
    marginBottom: '-2px',
    fontWeight: 'bold'
  };

  const contentStyle = {
    padding: '20px',
    minHeight: '400px'
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
        <span style={{ fontWeight: 'bold' }}>Azo Page Settings Manager</span>
        <span style={{ fontWeight: 'normal' }}> (internal snefuru app page creator)</span>
      </h1>

      <div style={dropdownContainerStyle}>
        <label style={labelStyle}>Select XPage:</label>
        <select 
          style={selectStyle}
          value={selectedXpageId || ''}
          onChange={(e) => handleXpageChange(Number(e.target.value))}
          disabled={loading}
        >
          <option value="">-- Select an XPage --</option>
          {xpages.map((xpage) => (
            <option key={xpage.xpage_id} value={xpage.xpage_id}>
              {xpage.xpage_id} - {xpage.title1 || '(No title)'}
            </option>
          ))}
        </select>

        <div style={tooltipContainerStyle}>
          <span 
            style={tooltipIconStyle}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            ℹ️
          </span>
          <label style={labelStyle}>Select UTG:</label>
          <div style={tooltipBoxStyle}>
            <span>All rows from utgs where rel_xpage_id matches xpages.xpage_id</span>
            <button style={copyButtonStyle} onClick={copyTooltipText}>Copy</button>
          </div>
        </div>
        
        <select 
          style={!selectedXpageId ? disabledSelectStyle : selectStyle}
          value={selectedUtgId || ''}
          onChange={(e) => handleUtgChange(e.target.value)}
          disabled={!selectedXpageId || loadingUtgs}
        >
          <option value="">-- Select a UTG --</option>
          {utgs.map((utg) => (
            <option key={utg.utg_id} value={utg.utg_id}>
              {utg.utg_id} - {utg.utg_name}
            </option>
          ))}
        </select>

        <label style={labelStyle}>Select Zarno:</label>
        <select 
          style={!selectedXpageId ? disabledSelectStyle : selectStyle}
          value={selectedZarnoId || ''}
          onChange={(e) => handleZarnoChange(e.target.value ? Number(e.target.value) : 0)}
          disabled={!selectedXpageId || loadingZarnos}
        >
          <option value="">-- Select a Zarno --</option>
          {zarnos.map((zarno) => (
            <option key={zarno.zarno_id} value={zarno.zarno_id}>
              {zarno.zarno_id} - {zarno.zarno_name || '(No name)'}
            </option>
          ))}
        </select>
      </div>

      <div style={tabContainerStyle}>
        <ul style={tabListStyle}>
          <li 
            style={activeTab === 'xpages' ? activeTabStyle : tabStyle}
            onClick={() => {
              setActiveTab('xpages');
              updateURLWithCurrentState({ tab: 'xpages' });
            }}
          >
            xpages
          </li>
          <li 
            style={activeTab === 'utgs' ? activeTabStyle : tabStyle}
            onClick={() => {
              setActiveTab('utgs');
              updateURLWithCurrentState({ tab: 'utgs' });
            }}
          >
            utgs
          </li>
          <li 
            style={activeTab === 'zarnos' ? activeTabStyle : tabStyle}
            onClick={() => {
              setActiveTab('zarnos');
              updateURLWithCurrentState({ tab: 'zarnos' });
            }}
          >
            zarnos
          </li>
        </ul>
      </div>

      <div style={contentStyle}>
        {!selectedXpageId ? (
          <div style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>
            <p>Please select an XPage from the dropdown above to manage its settings.</p>
          </div>
        ) : (
          <>
            {activeTab === 'xpages' && (
              <div>
                <h2>XPages Settings</h2>
                <p>Configure main settings for XPage ID: {selectedXpageId}</p>
                
                {selectedXpage && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ 
                      backgroundColor: '#b5edbc', 
                      border: '1px solid #273929', 
                      borderRadius: '7px', 
                      padding: '4px', 
                      marginBottom: '15px', 
                      fontSize: '16px', 
                      color: '#252525' 
                    }}>
                      <span style={{ fontWeight: 'bold' }}>bensa table instance</span>
                      <span style={{ fontWeight: 'normal' }}> (bensa is a sub-system of the jetla ui tables system) - bensa constrains columns and other behavior across tabs on xpages, utgs, zarnos, etc.</span>
                    </div>
                    <table style={{ borderCollapse: 'collapse', border: '1px solid #ddd', width: 'auto' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                          <th style={{ border: '1px solid #ddd', padding: '8px', width: '35px', whiteSpace: 'nowrap' }}>
                            <input
                              type="checkbox"
                              checked={selectedFields.size === xpageFields.length}
                              onChange={(e) => handleSelectAllFields(e.target.checked)}
                            />
                          </th>
                          <th 
                            style={{ 
                              border: '1px solid #ddd', 
                              padding: '8px', 
                              width: '35px', 
                              textAlign: 'center', 
                              whiteSpace: 'nowrap',
                              cursor: 'pointer',
                              userSelect: 'none',
                              position: 'relative'
                            }}
                            onClick={() => handleSort('starred')}
                          >
                            <span style={{ color: '#149a24' }}>★</span>
                            {sortBy === 'starred' && (
                              <span style={{ position: 'absolute', right: '2px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px' }}>
                                {sortDirection === 'asc' ? '▲' : '▼'}
                              </span>
                            )}
                          </th>
                          <th 
                            style={{ 
                              border: '1px solid #ddd', 
                              padding: '8px', 
                              width: '35px', 
                              textAlign: 'center', 
                              whiteSpace: 'nowrap',
                              cursor: 'pointer',
                              userSelect: 'none',
                              position: 'relative'
                            }}
                            onClick={() => handleSort('flagged')}
                          >
                            <svg 
                              width="16" 
                              height="16" 
                              viewBox="0 0 16 16" 
                              fill="#dc2626"
                              stroke="#dc2626"
                              strokeWidth="1.5"
                            >
                              <path d="M3 2v12M3 2l7 4-7 4" />
                            </svg>
                            {sortBy === 'flagged' && (
                              <span style={{ position: 'absolute', right: '2px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px' }}>
                                {sortDirection === 'asc' ? '▲' : '▼'}
                              </span>
                            )}
                          </th>
                          <th 
                            style={{ 
                              border: '1px solid #ddd', 
                              padding: '8px', 
                              width: '300px', 
                              fontWeight: 'bold', 
                              textAlign: 'left', 
                              whiteSpace: 'nowrap',
                              cursor: 'pointer',
                              userSelect: 'none',
                              position: 'relative'
                            }}
                            onClick={() => handleSort('field_name')}
                          >
                            xpages db field
                            {sortBy === 'field_name' && (
                              <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px' }}>
                                {sortDirection === 'asc' ? '▲' : '▼'}
                              </span>
                            )}
                          </th>
                          <th 
                            style={{ 
                              border: '1px solid #ddd', 
                              padding: '8px', 
                              fontWeight: 'bold', 
                              textAlign: 'left', 
                              whiteSpace: 'nowrap',
                              cursor: 'pointer',
                              userSelect: 'none',
                              position: 'relative'
                            }}
                            onClick={() => handleSort('value')}
                          >
                            value
                            {sortBy === 'value' && (
                              <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px' }}>
                                {sortDirection === 'asc' ? '▲' : '▼'}
                              </span>
                            )}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {getSortedFields().map((field) => {
                          const value = selectedXpage[field.key as keyof XPage];
                          const isEditing = editingField === field.key;
                          const isStarred = fieldMetadata[field.key]?.starred || false;
                          const isFlagged = fieldMetadata[field.key]?.flagged || false;
                          
                          return (
                            <tr key={field.key}>
                              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedFields.has(field.key)}
                                  onChange={(e) => handleFieldCheckboxChange(field.key, e.target.checked)}
                                />
                              </td>
                              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                                <button
                                  onClick={() => toggleFieldStar(field.key)}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    fontSize: '18px',
                                    cursor: 'pointer',
                                    color: isStarred ? '#149a24' : '#666',
                                    transition: 'color 0.2s'
                                  }}
                                  title={isStarred ? 'Remove star' : 'Add star'}
                                >
                                  {isStarred ? '★' : '☆'}
                                </button>
                              </td>
                              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                                <button
                                  onClick={() => toggleFieldFlag(field.key)}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    fontSize: '18px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  title={isFlagged ? 'Remove flag' : 'Add flag'}
                                >
                                  <svg 
                                    width="16" 
                                    height="16" 
                                    viewBox="0 0 16 16" 
                                    fill={isFlagged ? '#dc2626' : 'none'}
                                    stroke={isFlagged ? '#dc2626' : '#666'}
                                    strokeWidth="1.5"
                                  >
                                    <path d="M3 2v12M3 2l7 4-7 4" />
                                  </svg>
                                </button>
                              </td>
                              <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>
                                {field.key}
                              </td>
                              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                {field.type === 'boolean' && field.editable ? (
                                  <button
                                    onClick={() => handleBooleanToggle(field.key, value as boolean | null)}
                                    style={{
                                      width: '48px',
                                      height: '24px',
                                      borderRadius: '12px',
                                      border: 'none',
                                      cursor: 'pointer',
                                      backgroundColor: value === true ? '#22c55e' : value === false ? '#d1d5db' : '#fbbf24',
                                      color: 'white',
                                      fontSize: '12px',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    {value === true ? 'true' : value === false ? 'false' : 'null'}
                                  </button>
                                ) : isEditing ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                      type="text"
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      onBlur={handleFieldSave}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleFieldSave();
                                        if (e.key === 'Escape') handleFieldCancel();
                                      }}
                                      style={{
                                        flex: 1,
                                        padding: '4px 8px',
                                        border: '2px solid #3b82f6',
                                        borderRadius: '4px',
                                        outline: 'none'
                                      }}
                                      autoFocus
                                    />
                                    <button
                                      onClick={handleFieldSave}
                                      style={{
                                        padding: '4px 8px',
                                        backgroundColor: '#22c55e',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={handleFieldCancel}
                                      style={{
                                        padding: '4px 8px',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => handleFieldClick(field.key, value)}
                                    style={{
                                      cursor: field.editable ? 'pointer' : 'default',
                                      padding: '4px',
                                      borderRadius: '4px',
                                      backgroundColor: field.editable ? 'transparent' : '#f9f9f9',
                                      color: field.editable ? '#000' : '#666',
                                      minHeight: '20px'
                                    }}
                                    title={field.editable ? 'Click to edit' : 'Read only'}
                                  >
                                    {field.type === 'timestamp' && value
                                      ? new Date(value as string).toLocaleString()
                                      : value?.toString() || ''}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'utgs' && (
              <div>
                <h2>UTGs Settings</h2>
                <p>Configure UTG settings for XPage ID: {selectedXpageId}</p>
                {selectedUtgId && <p>Selected UTG: {selectedUtgId}</p>}

                {/* UTG Table */}
                {selectedUtgId && selectedUtgRecord && (
                  <>
                    <div style={{ 
                      backgroundColor: '#b5edbc', 
                      border: '1px solid #273929', 
                      borderRadius: '7px', 
                      padding: '4px', 
                      marginBottom: '15px', 
                      fontSize: '16px', 
                      color: '#252525' 
                    }}>
                      <span style={{ fontWeight: 'bold' }}>bensa table instance</span>
                      <span style={{ fontWeight: 'normal' }}> (bensa is a sub-system of the jetla ui tables system) - bensa constrains columns and other behavior across tabs on xpages, utgs, zarnos, etc.</span>
                    </div>
                    <BensaFieldTable
                    config={bensaUtgsConfig}
                    selectedRecord={selectedUtgRecord}
                    onRecordUpdate={handleUtgUpdate}
                  />
                  </>
                )}
              </div>
            )}
            {activeTab === 'zarnos' && (
              <div>
                <h2>Zarnos Settings</h2>
                <p>Configure Zarno settings for XPage ID: {selectedXpageId}</p>
                {selectedZarnoId && <p>Selected Zarno: {selectedZarnoId}</p>}

                {/* Zarno Table */}
                {selectedZarnoId && selectedZarnoRecord && (
                  <>
                    <div style={{ 
                      backgroundColor: '#b5edbc', 
                      border: '1px solid #273929', 
                      borderRadius: '7px', 
                      padding: '4px', 
                      marginBottom: '15px', 
                      fontSize: '16px', 
                      color: '#252525' 
                    }}>
                      <span style={{ fontWeight: 'bold' }}>bensa table instance</span>
                      <span style={{ fontWeight: 'normal' }}> (bensa is a sub-system of the jetla ui tables system) - bensa constrains columns and other behavior across tabs on xpages, utgs, zarnos, etc.</span>
                    </div>
                    <BensaFieldTable
                    config={bensaZarnosConfig}
                    selectedRecord={selectedZarnoRecord}
                    onRecordUpdate={handleZarnoUpdate}
                  />
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}