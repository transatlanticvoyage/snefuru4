'use client';

// @xpage-metadata
// URL: /admin/obi
// Title: Obi Page Settings Manager - Snefuru
// Last Sync: 2024-01-10T10:30:00Z

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import BensaFieldTable from '@/app/(protected3)/bensa/components/BensaFieldTable';
import { bensaUtgsConfig } from '@/app/(protected3)/bensa/config/bensaUtgsConfig';
import { bensaZarnosConfig } from '@/app/(protected3)/bensa/config/bensaZarnosConfig';
import { bensaXpagesConfig } from '@/app/(protected3)/bensa/config/bensaXpagesConfig';
import xpageCache from '@/app/metadata/xpage-cache.json';

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
  has_mutation_observer: string | null;
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
  const XPAGE_ID = 12; // Moved inside component to fix Next.js build error
  
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
  const [sortBy, setSortBy] = useState<string>('starred');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [boxEditorOpen, setBoxEditorOpen] = useState(false);
  const [boxEditorValue, setBoxEditorValue] = useState('');
  const [boxEditorField, setBoxEditorField] = useState<string>('');
  const [boxEditorRecord, setBoxEditorRecord] = useState<any>(null);
  const [boxEditorUpdateHandler, setBoxEditorUpdateHandler] = useState<((field: string, value: any) => Promise<void>) | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  // Get static metadata from cache
  const staticMetadata = (xpageCache as any)[XPAGE_ID.toString()];

  // Initialize page - only run once
  useEffect(() => {
    // Use static title from cache, fallback to hardcoded
    const staticTitle = staticMetadata?.title || 'Obi Page Settings Manager - Snefuru';
    document.title = staticTitle;
    fetchXpages();
    fetchFieldMetadata();
  }, [staticMetadata?.title]);

  // Handle URL parameters - only when searchParams change
  useEffect(() => {
    if (!searchParams) return;
    
    // Note: document.title is now handled by the initial useEffect with static cache
    
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
      
      // Auto-select if only one UTG available (only if no UTG is currently selected)
      if (data && data.length === 1 && !selectedUtgId) {
        const singleUtg = data[0];
        setSelectedUtgId(singleUtg.utg_id);
        fetchSelectedUtg(singleUtg.utg_id);
        // Don't update URL immediately to avoid conflicts
      }
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
      
      // Auto-select if only one Zarno available (only if no Zarno is currently selected)
      if (data && data.length === 1 && !selectedZarnoId) {
        const singleZarno = data[0];
        setSelectedZarnoId(singleZarno.zarno_id);
        fetchSelectedZarno(singleZarno.zarno_id);
        // Don't update URL immediately to avoid conflicts
      }
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
    // Get our correct title from cache before navigation
    const correctTitle = staticMetadata?.title || 'Obi Page Settings Manager - Snefuru';
    
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
    
    router.push(`/admin/obi?${params.toString()}`);
    
    // Aggressively restore title after navigation - multiple attempts to overcome Next.js metadata
    setTimeout(() => { document.title = correctTitle; }, 0);
    setTimeout(() => { document.title = correctTitle; }, 10);
    setTimeout(() => { document.title = correctTitle; }, 50);
    setTimeout(() => { document.title = correctTitle; }, 100);
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
    
    // Fetch related entities after URL update (which will auto-select if only one option)
    setTimeout(() => {
      fetchRelatedUtgs(xpageId);
      fetchRelatedZarnos(xpageId);
    }, 100);
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
    { key: 'urlparam_total_keys_listed', type: 'jsonb', editable: true },
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

  const handleBoxEditorOpen = (field: string, value: string, record: any, updateHandler: (field: string, value: any) => Promise<void>) => {
    setBoxEditorField(field);
    setBoxEditorValue(value || '');
    setBoxEditorRecord(record);
    setBoxEditorUpdateHandler(() => updateHandler);
    setBoxEditorOpen(true);
  };

  const handleBoxEditorSave = async () => {
    if (boxEditorUpdateHandler) {
      await boxEditorUpdateHandler(boxEditorField, boxEditorValue);
    }
    setBoxEditorOpen(false);
  };

  const handleBoxEditorClose = () => {
    setBoxEditorOpen(false);
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
    borderTop: '2px solid #a4a4a4',
    borderLeft: '2px solid #a4a4a4',
    borderRight: '2px solid #a4a4a4',
    borderBottom: '2px solid #ba5816',
    backgroundColor: '#f8f9fa',
    fontSize: '20px',
    fontWeight: '500'
  };

  const activeTabStyle = {
    ...tabStyle,
    backgroundColor: '#fff',
    borderBottom: '2px solid #fff',
    borderTop: '2px solid #ba5816',
    borderLeft: '2px solid #ba5816',
    borderRight: '2px solid #ba5816',
    fontWeight: 'bold'
  };

  const contentStyle = {
    padding: '20px',
    minHeight: '400px'
  };

  // Function to get appropriate tab style based on active tab and position
  const getTabStyle = (tabName: 'xpages' | 'utgs' | 'zarnos') => {
    if (tabName === activeTab) {
      return activeTabStyle;
    }
    
    // For inactive tabs, handle border collision with active tab and adjacent tabs
    let style = { ...tabStyle };
    
    // Remove right border if this tab is to the left of active tab
    if ((tabName === 'xpages' && activeTab === 'utgs') || 
        (tabName === 'utgs' && activeTab === 'zarnos')) {
      style.borderRight = 'none';
    }
    
    // Remove left border if this tab is to the right of active tab
    if ((tabName === 'utgs' && activeTab === 'xpages') || 
        (tabName === 'zarnos' && activeTab === 'utgs')) {
      style.borderLeft = 'none';
    }
    
    // Handle border doubling between adjacent inactive tabs
    // Remove right border from left tab in inactive pairs
    if (tabName === 'xpages' && activeTab === 'zarnos') {
      // xpages and utgs are both inactive, remove right border from xpages
      style.borderRight = 'none';
    } else if (tabName === 'utgs' && activeTab === 'xpages') {
      // utgs and zarnos are both inactive, remove right border from utgs
      style.borderRight = 'none';
    }
    
    return style;
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
        <span style={{ fontWeight: 'bold' }}>Obi Page Settings Manager</span>
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
            style={getTabStyle('xpages')}
            onClick={() => {
              setActiveTab('xpages');
              updateURLWithCurrentState({ tab: 'xpages' });
            }}
          >
            {activeTab === 'xpages' ? 
              <span style={{ color: 'red', marginRight: '14px' }}>★</span> : 
              <span style={{ color: 'black', marginRight: '14px' }}>•</span>
            }
            xpages
          </li>
          <li 
            style={getTabStyle('utgs')}
            onClick={() => {
              setActiveTab('utgs');
              updateURLWithCurrentState({ tab: 'utgs' });
            }}
          >
            {activeTab === 'utgs' ? 
              <span style={{ color: 'red', marginRight: '14px' }}>★</span> : 
              <span style={{ color: 'black', marginRight: '14px' }}>•</span>
            }
            utgs
          </li>
          <li 
            style={getTabStyle('zarnos')}
            onClick={() => {
              setActiveTab('zarnos');
              updateURLWithCurrentState({ tab: 'zarnos' });
            }}
          >
            {activeTab === 'zarnos' ? 
              <span style={{ color: 'red', marginRight: '14px' }}>★</span> : 
              <span style={{ color: 'black', marginRight: '14px' }}>•</span>
            }
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
                <div style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  padding: '15px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: 'black',
                    marginBottom: '10px'
                  }}>
                    devinfobox
                  </div>
                  <div style={{
                    backgroundColor: '#f1f3f4',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '8px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <button
                      onClick={() => {
                        const url = 'vscode://file/Users/kylecampbell/Documents/repos/localrepo-snefuru4/app/(protected)/admin/obi/page.tsx';
                        navigator.clipboard.writeText(url);
                      }}
                      style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                    <a 
                      href="vscode://file/Users/kylecampbell/Documents/repos/localrepo-snefuru4/app/(protected)/admin/obi/page.tsx"
                      style={{
                        color: '#0066cc',
                        textDecoration: 'none',
                        flex: 1
                      }}
                    >
                      vscode://file/Users/kylecampbell/Documents/repos/localrepo-snefuru4/app/(protected)/admin/obi/page.tsx
                    </a>
                  </div>
                </div>
                <h2>XPages Settings</h2>
                <p>Configure main settings for XPage ID: {selectedXpageId}</p>
                
                {selectedXpage && (
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
                      config={bensaXpagesConfig}
                      selectedRecord={selectedXpage}
                      onRecordUpdate={updateXpageField}
                      onBoxEditorOpen={handleBoxEditorOpen}
                    />
                  </>
                )}
              </div>
            )}
            {activeTab === 'utgs' && (
              <div>
                {selectedUtgId && (
                  <a
                    href={`/admin/coltempcommand?rel_utg_id=${selectedUtgId}`}
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      backgroundColor: '#121c67',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontSize: '16px',
                      marginBottom: '16px',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#121c67'}
                  >
                    View ColTemps For This UTG
                  </a>
                )}
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
                    onBoxEditorOpen={handleBoxEditorOpen}
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
                    onBoxEditorOpen={handleBoxEditorOpen}
                  />
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Box Editor Popup */}
      {boxEditorOpen && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '660px',
          height: '760px',
          backgroundColor: 'white',
          border: '2px solid #ccc',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid #ddd',
            paddingBottom: '10px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
              Box Editor - {boxEditorField}
            </h3>
            <button
              onClick={handleBoxEditorClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <textarea
              value={boxEditorValue}
              onChange={(e) => setBoxEditorValue(e.target.value)}
              style={{
                flex: 1,
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'monospace',
                resize: 'none',
                outline: 'none',
                whiteSpace: 'pre-wrap'
              }}
              placeholder="Enter text here..."
            />
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '20px',
            borderTop: '1px solid #ddd',
            paddingTop: '10px'
          }}>
            <button
              onClick={handleBoxEditorClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f5f5f5',
                color: '#333',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleBoxEditorSave}
              style={{
                padding: '8px 16px',
                backgroundColor: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}