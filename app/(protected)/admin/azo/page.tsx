'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface XPage {
  xpage_id: number;
  title1: string | null;
  main_url: string | null;
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

export default function AzoPage() {
  const [activeTab, setActiveTab] = useState<'xpages' | 'utgs' | 'zarnos'>('xpages');
  const [xpages, setXpages] = useState<XPage[]>([]);
  const [utgs, setUtgs] = useState<UTG[]>([]);
  const [selectedXpage, setSelectedXpage] = useState<XPage | null>(null);
  const [selectedXpageId, setSelectedXpageId] = useState<number | null>(null);
  const [selectedUtgId, setSelectedUtgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUtgs, setLoadingUtgs] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [fieldMetadata, setFieldMetadata] = useState<{[key: string]: {starred: boolean, flagged: boolean}}>({});
  const [sortBy, setSortBy] = useState<'starred' | 'flagged' | 'alphabetical'>('alphabetical');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    document.title = 'Azo Page Settings Manager';
    fetchXpages();
    fetchFieldMetadata();
    
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
    }
  }, [searchParams]);

  // Fetch UTGs when xpage is selected
  useEffect(() => {
    if (selectedXpageId) {
      fetchRelatedUtgs(selectedXpageId);
    } else {
      setUtgs([]);
      setSelectedUtgId(null);
    }
  }, [selectedXpageId]);

  const fetchXpages = async () => {
    try {
      const { data, error } = await supabase
        .from('xpages')
        .select('xpage_id, title1')
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

  const handleXpageChange = (xpageId: number) => {
    setSelectedXpageId(xpageId);
    fetchSelectedXpage(xpageId);
    router.push(`/admin/azo?xpage_id=${xpageId}`);
  };

  const handleUtgChange = (utgId: string) => {
    setSelectedUtgId(utgId);
    const params = new URLSearchParams(searchParams);
    params.set('utg_id', utgId);
    router.push(`/admin/azo?${params.toString()}`);
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
      setSelectedXpage(prev => prev ? { ...prev, [field]: value } : null);
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

  // Sort fields based on selected sort option
  const getSortedFields = () => {
    const fieldsWithMetadata = xpageFields.map(field => ({
      ...field,
      starred: fieldMetadata[field.key]?.starred || false,
      flagged: fieldMetadata[field.key]?.flagged || false
    }));

    switch (sortBy) {
      case 'starred':
        return fieldsWithMetadata.sort((a, b) => {
          if (a.starred && !b.starred) return -1;
          if (!a.starred && b.starred) return 1;
          return a.key.localeCompare(b.key);
        });
      case 'flagged':
        return fieldsWithMetadata.sort((a, b) => {
          if (a.flagged && !b.flagged) return -1;
          if (!a.flagged && b.flagged) return 1;
          return a.key.localeCompare(b.key);
        });
      case 'alphabetical':
      default:
        return fieldsWithMetadata.sort((a, b) => a.key.localeCompare(b.key));
    }
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
      </div>

      <div style={tabContainerStyle}>
        <ul style={tabListStyle}>
          <li 
            style={activeTab === 'xpages' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('xpages')}
          >
            xpages - main settings
          </li>
          <li 
            style={activeTab === 'utgs' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('utgs')}
          >
            utgs - main settings
          </li>
          <li 
            style={activeTab === 'zarnos' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('zarnos')}
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
                    {/* Sort Controls */}
                    <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <label style={{ fontWeight: 'bold' }}>Sort by:</label>
                      <button
                        onClick={() => setSortBy('alphabetical')}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: sortBy === 'alphabetical' ? '#3b82f6' : '#e5e7eb',
                          color: sortBy === 'alphabetical' ? 'white' : '#374151',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Alphabetical
                      </button>
                      <button
                        onClick={() => setSortBy('starred')}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: sortBy === 'starred' ? '#3b82f6' : '#e5e7eb',
                          color: sortBy === 'starred' ? 'white' : '#374151',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        ⭐ Starred First
                      </button>
                      <button
                        onClick={() => setSortBy('flagged')}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: sortBy === 'flagged' ? '#3b82f6' : '#e5e7eb',
                          color: sortBy === 'flagged' ? 'white' : '#374151',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        🚩 Flagged First
                      </button>
                    </div>

                    <table style={{ borderCollapse: 'collapse', border: '1px solid #ddd', width: 'auto' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                          <th style={{ border: '1px solid #ddd', padding: '8px', whiteSpace: 'nowrap' }}>
                            <input
                              type="checkbox"
                              checked={selectedFields.size === xpageFields.length}
                              onChange={(e) => handleSelectAllFields(e.target.checked)}
                            />
                          </th>
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            ⭐
                          </th>
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            🚩
                          </th>
                          <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>
                            xpages db field
                          </th>
                          <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>
                            value
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
                                    opacity: isStarred ? 1 : 0.3,
                                    transition: 'opacity 0.2s'
                                  }}
                                  title={isStarred ? 'Remove star' : 'Add star'}
                                >
                                  ⭐
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
                                    opacity: isFlagged ? 1 : 0.3,
                                    transition: 'opacity 0.2s'
                                  }}
                                  title={isFlagged ? 'Remove flag' : 'Add flag'}
                                >
                                  🚩
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
              </div>
            )}
            {activeTab === 'zarnos' && (
              <div>
                
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}