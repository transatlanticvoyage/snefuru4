'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface UiTableGrid {
  utg_id: string;
  utg_name: string;
  utg_columns_definition_location: string | null;
  utg_description: string | null;
  sheaf_ui_columns_base_foundation: any;
  monolith_of_ui_columns: string | null;
  whale_ui_column_definition_source_keys: string | null;
  rel_xpage_id: number | null;
  rel_xpage: string | null;
  main_db_table: string | null;
  sql_view: string | null;
  associated_files: any;
  utg_class: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  sort_order: number;
  horomi_active: boolean;
  vertomi_active: boolean;
  header_rows_definition_fantasy: any;
  filters_notes: string | null;
  pagination_notes: string | null;
  searchbox_notes: string | null;
  utg_columns_definition_file_link: string | null;
}

interface XPage {
  xpage_id: number;
  title1: string | null;
}

export default function UiTableGridsTable() {
  const [data, setData] = useState<UiTableGrid[]>([]);
  const [xpages, setXpages] = useState<XPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(200);
  const [sortField, setSortField] = useState<keyof UiTableGrid | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<UiTableGrid | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteSecondConfirm, setDeleteSecondConfirm] = useState(false);
  
  // Content viewer modal state
  const [isContentViewerOpen, setIsContentViewerOpen] = useState(false);
  const [contentViewerData, setContentViewerData] = useState<{title: string; content: string; recordId: string} | null>(null);
  const [isContentEditing, setIsContentEditing] = useState(false);
  const [contentEditValue, setContentEditValue] = useState('');
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // UTG ID warning states
  const [utgIdWarningData, setUtgIdWarningData] = useState<{ id: string; field: string; value: string } | null>(null);
  const [showFirstWarning, setShowFirstWarning] = useState(false);
  const [showSecondWarning, setShowSecondWarning] = useState(false);
  
  // JSON Editor states
  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false);
  const [jsonEditorData, setJsonEditorData] = useState<{ recordId: string; value: string } | null>(null);
  const [jsonEditValue, setJsonEditValue] = useState('');
  
  // Text Editor states (for monolith)
  const [isTextEditorOpen, setIsTextEditorOpen] = useState(false);
  const [textEditorData, setTextEditorData] = useState<{ recordId: string; value: string; fieldName: string } | null>(null);
  const [textEditValue, setTextEditValue] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    utg_id: '',
    utg_name: '',
    utg_columns_definition_location: '',
    utg_description: '',
    sheaf_ui_columns_base_foundation: '',
    monolith_of_ui_columns: '',
    whale_ui_column_definition_source_keys: '',
    rel_xpage_id: null as number | null,
    rel_xpage: '',
    main_db_table: '',
    sql_view: '',
    associated_files: '',
    utg_class: '',
    is_active: true,
    sort_order: 0,
    horomi_active: false,
    vertomi_active: false,
    header_rows_definition_fantasy: '',
    filters_notes: '',
    pagination_notes: '',
    searchbox_notes: '',
    utg_columns_definition_file_link: ''
  });
  
  const supabase = createClientComponentClient();
  
  // Fetch data
  useEffect(() => {
    fetchData();
    fetchXpages();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: tableData, error: fetchError } = await supabase
        .from('utgs')
        .select('*')
        .order('utg_id', { ascending: true });
        
      if (fetchError) throw fetchError;
      setData(tableData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchXpages = async () => {
    try {
      const { data: xpagesData, error: fetchError } = await supabase
        .from('xpages')
        .select('xpage_id, title1')
        .order('xpage_id', { ascending: true });
        
      if (fetchError) throw fetchError;
      setXpages(xpagesData || []);
    } catch (err) {
      console.error('Error fetching xpages:', err);
    }
  };
  
  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row => {
      return Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [data, searchTerm]);
  
  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [filteredData, sortField, sortOrder]);
  
  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  
  // Handle sorting
  const handleSort = (field: keyof UiTableGrid) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  // Handle create
  const handleCreate = async () => {
    try {
      let associatedFilesData = null;
      if (formData.associated_files && formData.associated_files.trim()) {
        try {
          associatedFilesData = JSON.parse(formData.associated_files);
        } catch (parseError) {
          alert('Invalid JSON in associated_files field. Please check the format.');
          return;
        }
      }

      let headerRowsDefinitionFantasyData = null;
      if (formData.header_rows_definition_fantasy && formData.header_rows_definition_fantasy.trim()) {
        try {
          headerRowsDefinitionFantasyData = JSON.parse(formData.header_rows_definition_fantasy);
        } catch (parseError) {
          alert('Invalid JSON in header_rows_definition_fantasy field. Please check the format.');
          return;
        }
      }

      let sheafUiColumnsBaseFoundationData = null;
      if (formData.sheaf_ui_columns_base_foundation && formData.sheaf_ui_columns_base_foundation.trim()) {
        try {
          sheafUiColumnsBaseFoundationData = JSON.parse(formData.sheaf_ui_columns_base_foundation);
        } catch (parseError) {
          alert('Invalid JSON in sheaf_ui_columns_base_foundation field. Please check the format.');
          return;
        }
      }
      
      const { error: insertError } = await supabase
        .from('utgs')
        .insert([{
          ...formData,
          associated_files: associatedFilesData,
          header_rows_definition_fantasy: headerRowsDefinitionFantasyData,
          sheaf_ui_columns_base_foundation: sheafUiColumnsBaseFoundationData
        }]);
        
      if (insertError) throw insertError;
      
      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error creating record:', err);
      alert(`Failed to create record: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Handle inline create
  const handleCreateInline = async () => {
    try {
      const { data, error } = await supabase
        .from('utgs')
        .insert({
          utg_id: `new_utg_${Date.now()}`,
          utg_name: 'New UTG'
        })
        .select('*')
        .single();

      if (error) throw error;
      
      // Add the new record to the beginning of the data array
      setData(prev => [data, ...prev]);
      
      // Start editing the utg_name field of the new record
      setTimeout(() => {
        startInlineEdit(data.utg_id, 'utg_name', data.utg_name || '');
      }, 100);
    } catch (err) {
      console.error('Error creating record:', err);
      alert(`Failed to create record: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Handle edit
  const handleEdit = async () => {
    if (!editingRecord) return;
    
    try {
      let associatedFilesData = null;
      if (formData.associated_files && formData.associated_files.trim()) {
        try {
          associatedFilesData = JSON.parse(formData.associated_files);
        } catch (parseError) {
          alert('Invalid JSON in associated_files field. Please check the format.');
          return;
        }
      }

      let headerRowsDefinitionFantasyData = null;
      if (formData.header_rows_definition_fantasy && formData.header_rows_definition_fantasy.trim()) {
        try {
          headerRowsDefinitionFantasyData = JSON.parse(formData.header_rows_definition_fantasy);
        } catch (parseError) {
          alert('Invalid JSON in header_rows_definition_fantasy field. Please check the format.');
          return;
        }
      }

      let sheafUiColumnsBaseFoundationData = null;
      if (formData.sheaf_ui_columns_base_foundation && formData.sheaf_ui_columns_base_foundation.trim()) {
        try {
          sheafUiColumnsBaseFoundationData = JSON.parse(formData.sheaf_ui_columns_base_foundation);
        } catch (parseError) {
          alert('Invalid JSON in sheaf_ui_columns_base_foundation field. Please check the format.');
          return;
        }
      }
      
      const { error: updateError } = await supabase
        .from('utgs')
        .update({
          ...formData,
          associated_files: associatedFilesData,
          header_rows_definition_fantasy: headerRowsDefinitionFantasyData,
          sheaf_ui_columns_base_foundation: sheafUiColumnsBaseFoundationData
        })
        .eq('utg_id', editingRecord.utg_id);
        
      if (updateError) throw updateError;
      
      setIsEditModalOpen(false);
      setEditingRecord(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error updating record:', err);
      alert(`Failed to update record: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Handle delete
  const handleDelete = async (id: string) => {
    if (!deleteSecondConfirm) {
      setDeleteSecondConfirm(true);
      return;
    }
    
    try {
      const { error: deleteError } = await supabase
        .from('utgs')
        .delete()
        .eq('utg_id', id);
        
      if (deleteError) throw deleteError;
      
      setDeleteConfirmId(null);
      setDeleteSecondConfirm(false);
      fetchData();
    } catch (err) {
      console.error('Error deleting record:', err);
      alert('Failed to delete record');
    }
  };
  
  // Start edit
  const startEdit = (record: UiTableGrid) => {
    setEditingRecord(record);
    setFormData({
      utg_id: record.utg_id,
      utg_name: record.utg_name,
      utg_columns_definition_location: record.utg_columns_definition_location || '',
      utg_description: record.utg_description || '',
      sheaf_ui_columns_base_foundation: record.sheaf_ui_columns_base_foundation ? JSON.stringify(record.sheaf_ui_columns_base_foundation) : '',
      monolith_of_ui_columns: record.monolith_of_ui_columns || '',
      whale_ui_column_definition_source_keys: record.whale_ui_column_definition_source_keys || '',
      rel_xpage_id: record.rel_xpage_id,
      rel_xpage: record.rel_xpage || '',
      main_db_table: record.main_db_table || '',
      sql_view: record.sql_view || '',
      associated_files: record.associated_files ? JSON.stringify(record.associated_files) : '',
      utg_class: record.utg_class || '',
      is_active: record.is_active,
      sort_order: record.sort_order,
      horomi_active: record.horomi_active,
      vertomi_active: record.vertomi_active,
      header_rows_definition_fantasy: record.header_rows_definition_fantasy ? JSON.stringify(record.header_rows_definition_fantasy) : '',
      filters_notes: record.filters_notes || '',
      pagination_notes: record.pagination_notes || '',
      searchbox_notes: record.searchbox_notes || '',
      utg_columns_definition_file_link: record.utg_columns_definition_file_link || ''
    });
    setIsEditModalOpen(true);
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      utg_id: '',
      utg_name: '',
      utg_columns_definition_location: '',
      utg_description: '',
      sheaf_ui_columns_base_foundation: '',
      monolith_of_ui_columns: '',
      whale_ui_column_definition_source_keys: '',
      rel_xpage_id: null,
      rel_xpage: '',
      main_db_table: '',
      sql_view: '',
      associated_files: '',
      utg_class: '',
      is_active: true,
      sort_order: 0,
      horomi_active: false,
      vertomi_active: false,
      header_rows_definition_fantasy: '',
      filters_notes: '',
      pagination_notes: '',
      searchbox_notes: '',
      utg_columns_definition_file_link: ''
    });
  };

  // Handle inline editing
  const startInlineEdit = (id: string, field: string, currentValue: any) => {
    if (field === 'utg_id') {
      // Show first warning for utg_id editing
      setUtgIdWarningData({ id, field, value: currentValue || '' });
      setShowFirstWarning(true);
    } else {
      setEditingCell({ id, field });
      setEditingValue(currentValue || '');
    }
  };

  const saveInlineEdit = async () => {
    if (!editingCell) return;
    
    try {
      const updates = { [editingCell.field]: editingValue || null };
      const { error } = await supabase
        .from('utgs')
        .update(updates)
        .eq('utg_id', editingCell.id);

      if (error) throw error;

      // Update local data
      setData(prevData => 
        prevData.map(item => 
          item.utg_id === editingCell.id 
            ? { ...item, [editingCell.field]: editingValue || null }
            : item
        )
      );
      
      setEditingCell(null);
      setEditingValue('');
    } catch (err) {
      console.error('Error updating field:', err);
      alert('Failed to update field');
    }
  };

  const cancelInlineEdit = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  // Handle xpage dropdown change
  const handleXpageChange = async (utgId: string, xpageId: string) => {
    try {
      const xpageIdValue = xpageId === '' ? null : parseInt(xpageId);
      
      const { error } = await supabase
        .from('utgs')
        .update({ rel_xpage_id: xpageIdValue })
        .eq('utg_id', utgId);

      if (error) throw error;

      // Update local data
      setData(prevData => 
        prevData.map(item => 
          item.utg_id === utgId 
            ? { ...item, rel_xpage_id: xpageIdValue }
            : item
        )
      );
    } catch (err) {
      console.error('Error updating xpage relationship:', err);
      alert('Failed to update xpage relationship');
    }
  };

  // Handle opening content viewer
  const openContentViewer = (title: string, content: string, recordId: string) => {
    setContentViewerData({ title, content, recordId });
    setContentEditValue(content);
    setIsContentViewerOpen(true);
    setIsContentEditing(true); // Start in edit mode by default
  };

  // Handle closing content viewer
  const closeContentViewer = () => {
    setIsContentViewerOpen(false);
    setContentViewerData(null);
    setIsContentEditing(false);
    setContentEditValue('');
  };

  // Handle saving content from viewer
  const saveContentFromViewer = async () => {
    if (!contentViewerData) return;
    
    try {
      const { error } = await supabase
        .from('utgs')
        .update({ utg_columns_definition_location: contentEditValue })
        .eq('utg_id', contentViewerData.recordId);

      if (error) throw error;

      // Update local data
      setData(prevData => 
        prevData.map(item => 
          item.utg_id === contentViewerData.recordId 
            ? { ...item, utg_columns_definition_location: contentEditValue }
            : item
        )
      );
      
      // Update the viewer data
      setContentViewerData(prev => prev ? { ...prev, content: contentEditValue } : null);
      setIsContentEditing(false);
      alert('Content saved successfully!');
    } catch (err) {
      console.error('Error saving content:', err);
      alert('Failed to save content');
    }
  };

  // Column Definition Analysis Function
  const analyzeColumnDefinitions = async (utgId: string) => {
    try {
      const record = data.find(r => r.utg_id === utgId);
      if (!record) {
        alert('Record not found');
        return;
      }

      // Get column definitions based on UTG type
      let columnKeys: string[] = [];
      
      if (utgId === 'utg_addressjar') {
        // Extract column keys from AddressjarTable component
        columnKeys = [
          'addresspren_id',
          'fk_addressglub_id', 
          'address_label',
          'org_is_starred',
          'org_is_flagged',
          'org_is_circled',
          'org_is_squared',
          'org_is_triangled',
          'related_sites_internal',
          'related_sites_external',
          'full_address_input',
          'internal_notes',
          'address_purpose',
          'is_primary',
          'is_active',
          'is_favorite',
          'last_used_at',
          'usage_count',
          'addresspren_created_at',
          'addressglub_id',
          'street_1',
          'street_2',
          'city',
          'state_code',
          'state_full',
          'zip_code',
          'country_code',
          'country',
          'street_1_clean',
          'full_address_formatted',
          'latitude',
          'longitude',
          'is_validated',
          'validation_source',
          'validation_accuracy',
          'plus_four',
          'fk_city_id',
          'fk_address_species_id',
          'addressglub_usage_count',
          'quality_score',
          'confidence_level',
          'is_business',
          'is_residential',
          'is_po_box',
          'is_apartment',
          'is_suite',
          'data_source',
          'source_reference',
          'addressglub_created_at',
          'addressglub_updated_at',
          'address_hash'
        ];
      } else {
        // For other UTGs, we could add more analysis logic here
        alert(`Analysis not yet implemented for ${utgId}. Currently only supports utg_addressjar.`);
        return;
      }

      // Convert to newline-separated string
      const columnKeysText = columnKeys.join('\n');
      
      // Confirm with user before saving
      const confirmed = window.confirm(
        `Found ${columnKeys.length} column definitions for ${utgId}.\n\nFirst few columns:\n${columnKeys.slice(0, 5).join('\n')}\n...\n\nSave these to whale_ui_column_definition_source_keys?`
      );
      
      if (!confirmed) return;

      // Update the database
      const { error } = await supabase
        .from('utgs')
        .update({ whale_ui_column_definition_source_keys: columnKeysText })
        .eq('utg_id', utgId);

      if (error) throw error;

      // Update local data
      setData(prevData =>
        prevData.map(item =>
          item.utg_id === utgId
            ? { ...item, whale_ui_column_definition_source_keys: columnKeysText }
            : item
        )
      );

      alert(`Successfully analyzed and saved ${columnKeys.length} column definitions for ${utgId}!`);
      
    } catch (err) {
      console.error('Error analyzing column definitions:', err);
      alert('Failed to analyze column definitions: ' + (err as Error).message);
    }
  };

  const consolidateUtgRows = async () => {
    try {
      const addressjarRow = data.find(r => r.utg_id === 'addressjar');
      const utgAddressjarRow = data.find(r => r.utg_id === 'utg_addressjar');
      
      if (!addressjarRow || !utgAddressjarRow) {
        alert('Could not find both UTG rows for consolidation');
        return;
      }

      // Check what data needs to be transferred
      const transferData: string[] = [];
      const updateFields: any = {};
      
      if (addressjarRow.whale_ui_column_definition_source_keys && !utgAddressjarRow.whale_ui_column_definition_source_keys) {
        transferData.push('whale_ui_column_definition_source_keys');
        updateFields.whale_ui_column_definition_source_keys = addressjarRow.whale_ui_column_definition_source_keys;
      }
      if (addressjarRow.monolith_of_ui_columns && !utgAddressjarRow.monolith_of_ui_columns) {
        transferData.push('monolith_of_ui_columns');
        updateFields.monolith_of_ui_columns = addressjarRow.monolith_of_ui_columns;
      }
      if (addressjarRow.sheaf_ui_columns_base_foundation && !utgAddressjarRow.sheaf_ui_columns_base_foundation) {
        transferData.push('sheaf_ui_columns_base_foundation');
        updateFields.sheaf_ui_columns_base_foundation = addressjarRow.sheaf_ui_columns_base_foundation;
      }
      
      if (transferData.length === 0) {
        const shouldDelete = window.confirm(
          'No data needs to be transferred from "addressjar" to "utg_addressjar".\n\nProceed with deleting the "addressjar" row?'
        );
        if (!shouldDelete) return;
      } else {
        const shouldTransfer = window.confirm(
          `Transfer the following data from "addressjar" to "utg_addressjar":\n\n${transferData.join('\n')}\n\nThen delete the "addressjar" row?`
        );
        if (!shouldTransfer) return;
        
        // Perform the transfer
        const { error: updateError } = await supabase
          .from('utgs')
          .update(updateFields)
          .eq('utg_id', 'utg_addressjar');
          
        if (updateError) throw updateError;
      }

      // Delete the addressjar row
      const { error: deleteError } = await supabase
        .from('utgs')
        .delete()
        .eq('utg_id', 'addressjar');
        
      if (deleteError) throw deleteError;

      // Update local data
      setData(prevData => {
        return prevData
          .map(item =>
            item.utg_id === 'utg_addressjar' && transferData.length > 0
              ? { ...item, ...updateFields }
              : item
          )
          .filter(item => item.utg_id !== 'addressjar');
      });

      alert('Successfully consolidated UTG rows! Transferred data to "utg_addressjar" and deleted "addressjar" row.');
      
    } catch (err) {
      console.error('Error consolidating UTG rows:', err);
      alert('Failed to consolidate UTG rows: ' + (err as Error).message);
    }
  };

  const generateSheafAndMonolithData = async (utgId: string) => {
    try {
      if (utgId !== 'utg_addressjar') {
        alert('Sheaf generation currently only supports utg_addressjar');
        return;
      }

      const confirmed = window.confirm(
        'Generate sheaf_ui_columns_base_foundation and monolith_of_ui_columns data for utg_addressjar?\n\nThis will create the standard addressjar column structure.'
      );
      if (!confirmed) return;

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

      // Generate monolith text format from sheaf data
      const columns = realSheafData.columns;
      const sortedColumns = [...columns].sort((a, b) => (a.order || 0) - (b.order || 0));
      
      const monolithText = sortedColumns.map(column => {
        if (column.type === 'separator') {
          return `SEPARATOR|${column.separator}|${column.width}`;
        }
        
        const parts = [
          column.id,
          column.name || column.id,
          column.type || 'text',
          column.width || 'auto',
          column.readOnly ? 'readonly' : 'editable',
          column.visible ? 'visible' : 'hidden',
          column.group || '',
          column.separator || ''
        ];
        
        return parts.join('|');
      }).join('\n');

      // Update the database
      const { error } = await supabase
        .from('utgs')
        .update({ 
          sheaf_ui_columns_base_foundation: realSheafData,
          monolith_of_ui_columns: monolithText
        })
        .eq('utg_id', utgId);

      if (error) throw error;

      // Update local data
      setData(prevData =>
        prevData.map(item =>
          item.utg_id === utgId
            ? { 
                ...item, 
                sheaf_ui_columns_base_foundation: realSheafData,
                monolith_of_ui_columns: monolithText
              }
            : item
        )
      );

      alert(`Successfully generated sheaf and monolith data for ${utgId}!`);
      
    } catch (err) {
      console.error('Error generating sheaf and monolith data:', err);
      alert('Failed to generate data: ' + (err as Error).message);
    }
  };

  // Define column order
  const columnOrder = [
    'utg_id', 'utg_name', 'utg_columns_definition_location', 'utg_description', 'sheaf_ui_columns_base_foundation', 'monolith_of_ui_columns', 'whale_ui_column_definition_source_keys', 'rel_xpage_id', 'rel_xpage',
    'main_db_table', 'sql_view', 'associated_files', 'utg_class', 'created_at', 'updated_at',
    'is_active', 'sort_order', 'horomi_active', 'vertomi_active', 'header_rows_definition_fantasy',
    'filters_notes', 'pagination_notes', 'searchbox_notes', 'utg_columns_definition_file_link'
  ];

  // Define which fields can be inline edited (excluding boolean and timestamp fields)
  const inlineEditableFields = [
    'utg_id', 'utg_name', 'utg_columns_definition_location', 'utg_description', 'rel_xpage', 
    'main_db_table', 'sql_view', 'utg_class', 'filters_notes', 'pagination_notes', 'searchbox_notes',
    'utg_columns_definition_file_link'
  ];
  
  if (loading) {
    return <div className="p-4">Loading...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }
  
  return (
    <div className="p-4">
      {/* Controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreateInline}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Create New (Inline)
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create New Entry
          </button>
          <button
            onClick={consolidateUtgRows}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            title="Transfer data from 'addressjar' to 'utg_addressjar' and delete duplicate"
          >
            Consolidate UTG Rows
          </button>
          <button
            onClick={() => generateSheafAndMonolithData('utg_addressjar')}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            title="Generate sheaf and monolith data for utg_addressjar"
          >
            Generate UTG Data
          </button>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider border border-gray-200">
                actions
              </th>
              {columnOrder.map((column) => (
                <th
                  key={column}
                  onClick={() => handleSort(column as keyof UiTableGrid)}
                  className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider cursor-pointer hover:bg-gray-100 border border-gray-200"
                >
                  {column}
                  {sortField === column && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row) => (
              <tr key={row.utg_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm border border-gray-200">
                  <button
                    onClick={() => startEdit(row)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  {deleteConfirmId === row.utg_id ? (
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(row.utg_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        {deleteSecondConfirm ? 'Really Delete?' : 'Confirm Delete'}
                      </button>
                      <button
                        onClick={() => {
                          setDeleteConfirmId(null);
                          setDeleteSecondConfirm(false);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(row.utg_id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  )}
                </td>
                {columnOrder.map((key) => {
                  const value = row[key as keyof UiTableGrid];
                  const isEditing = editingCell?.id === row.utg_id && editingCell?.field === key;
                  const isEditable = inlineEditableFields.includes(key);
                  
                  return (
                    <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">
                      {key === 'utg_columns_definition_location' ? (
                        // Special handling for utg_columns_definition_location
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            {isEditing ? (
                              <textarea
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={saveInlineEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.ctrlKey) saveInlineEdit();
                                  if (e.key === 'Escape') cancelInlineEdit();
                                }}
                                className="w-full px-1 py-0.5 border border-blue-500 rounded"
                                rows={3}
                                autoFocus
                              />
                            ) : (
                              <div
                                className="min-w-[30px] min-h-[1.25rem] cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                                onClick={() => startInlineEdit(row.utg_id, key, value)}
                                title="Click to edit (Ctrl+Enter to save)"
                              >
                                {value === null ? '' : String(value).substring(0, 14) + (String(value).length > 14 ? '...' : '')}
                              </div>
                            )}
                          </div>
                          {value && String(value).length > 0 && (
                            <button
                              onClick={() => openContentViewer(`utgs.utg_columns_definition_location FOR utg_id: ${row.utg_id}`, String(value), row.utg_id)}
                              className="w-4 h-4 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center text-xs"
                              title="View full content"
                            >
                              📄
                            </button>
                          )}
                        </div>
                      ) : key === 'sheaf_ui_columns_base_foundation' ? (
                        // Special handling for sheaf_ui_columns_base_foundation - JSON popup editor
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`} 
                                 title={value ? 'Has data' : 'Empty'}></div>
                            <span className="text-xs text-gray-600">
                              {value ? 'JSON Data' : 'Empty'}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setJsonEditorData({ recordId: row.utg_id, value: value ? JSON.stringify(value, null, 2) : '' });
                              setJsonEditValue(value ? JSON.stringify(value, null, 2) : '');
                              setIsJsonEditorOpen(true);
                            }}
                            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded"
                          >
                            Popup Editor
                          </button>
                          <button
                            onClick={() => generateSheafAndMonolithData(row.utg_id)}
                            className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs rounded"
                            title="Auto-fetch standard sheaf data for this UTG"
                          >
                            Fetch Sheaf
                          </button>
                        </div>
                      ) : key === 'monolith_of_ui_columns' ? (
                        // Special handling for monolith_of_ui_columns - Text popup editor
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${value ? 'bg-blue-500' : 'bg-gray-300'}`} 
                                 title={value ? 'Has data' : 'Empty'}></div>
                            <span className="text-xs text-gray-600">
                              {value ? 'Text Data' : 'Empty'}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setTextEditorData({ recordId: row.utg_id, value: value || '', fieldName: 'monolith_of_ui_columns' });
                              setTextEditValue(value || '');
                              setIsTextEditorOpen(true);
                            }}
                            className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded"
                          >
                            Popup Editor
                          </button>
                        </div>
                      ) : key === 'whale_ui_column_definition_source_keys' ? (
                        // Special handling for whale_ui_column_definition_source_keys - Text popup editor with admin analysis
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`} 
                                 title={value ? 'Has data' : 'Empty'}></div>
                            <span className="text-xs text-gray-600">
                              {value ? `${value.split('\n').filter(l => l.trim()).length} Keys` : 'Empty'}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => analyzeColumnDefinitions(row.utg_id)}
                              className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded"
                              title="Analyze & extract column definitions from source"
                            >
                              Analyze
                            </button>
                            <button
                              onClick={() => {
                                setTextEditorData({ recordId: row.utg_id, value: value || '', fieldName: 'whale_ui_column_definition_source_keys' });
                                setTextEditValue(value || '');
                                setIsTextEditorOpen(true);
                              }}
                              className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs rounded"
                            >
                              Open Popup
                            </button>
                          </div>
                        </div>
                      ) : key === 'rel_xpage_id' ? (
                        // Special dropdown for xpage relationship
                        <select
                          value={value || ''}
                          onChange={(e) => handleXpageChange(row.utg_id, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Select XPage --</option>
                          {xpages.map((xpage) => (
                            <option key={xpage.xpage_id} value={xpage.xpage_id}>
                              {xpage.xpage_id} - {xpage.title1 || '(No title)'}
                            </option>
                          ))}
                        </select>
                      ) : isEditable ? (
                        isEditing ? (
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={saveInlineEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit();
                              if (e.key === 'Escape') cancelInlineEdit();
                            }}
                            className="w-full px-1 py-0.5 border border-blue-500 rounded"
                            autoFocus
                          />
                        ) : (
                          <div
                            className="min-w-[30px] min-h-[1.25rem] cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                            onClick={() => startInlineEdit(row.utg_id, key, value)}
                            title="Click to edit"
                          >
                            {value === null ? '' : String(value)}
                          </div>
                        )
                      ) : typeof value === 'boolean' ? (value ? 'true' : 'false') : 
                       typeof value === 'object' ? JSON.stringify(value) : 
                       value === null ? '' : String(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} results
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Last
          </button>
        </div>
      </div>
      
      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Entry</h2>
            
            {/* Top save button */}
            <div className="mb-6 flex justify-end gap-3 border-b border-gray-200 pb-4">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">utg_name</label>
                <input
                  type="text"
                  value={formData.utg_name}
                  onChange={(e) => setFormData({...formData, utg_name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">utg_columns_definition_location</label>
                <textarea
                  value={formData.utg_columns_definition_location}
                  onChange={(e) => setFormData({...formData, utg_columns_definition_location: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                  rows={6}
                  placeholder="Store large text responses from Claude/Cursor for column definitions..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">utg_description</label>
                <textarea
                  value={formData.utg_description}
                  onChange={(e) => setFormData({...formData, utg_description: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">sheaf_ui_columns_base_foundation</label>
                <textarea
                  value={formData.sheaf_ui_columns_base_foundation}
                  onChange={(e) => setFormData({...formData, sheaf_ui_columns_base_foundation: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                  rows={6}
                  placeholder='{"base_column_order": ["table.column1", "table.column2"], "wolf_exclusion_band": [], "column_groups": {}}'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">monolith_of_ui_columns</label>
                <textarea
                  value={formData.monolith_of_ui_columns}
                  onChange={(e) => setFormData({...formData, monolith_of_ui_columns: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                  rows={6}
                  placeholder="addresspren.addresspren_id&#10;addresspren.fk_addressglub_id&#10;addresspren.address_label&#10;..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">whale_ui_column_definition_source_keys</label>
                <textarea
                  value={formData.whale_ui_column_definition_source_keys}
                  onChange={(e) => setFormData({...formData, whale_ui_column_definition_source_keys: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                  rows={6}
                  placeholder="addresspren_id&#10;fk_addressglub_id&#10;address_label&#10;is_po_box&#10;..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Actual source column keys from table definition. Use 'Analyze' button to auto-populate.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">rel_xpage</label>
                <input
                  type="text"
                  value={formData.rel_xpage}
                  onChange={(e) => setFormData({...formData, rel_xpage: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">main_db_table</label>
                <input
                  type="text"
                  value={formData.main_db_table}
                  onChange={(e) => setFormData({...formData, main_db_table: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">sql_view</label>
                <input
                  type="text"
                  value={formData.sql_view}
                  onChange={(e) => setFormData({...formData, sql_view: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">associated_files (JSON)</label>
                <textarea
                  value={formData.associated_files}
                  onChange={(e) => setFormData({...formData, associated_files: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Enter valid JSON, e.g. {&quot;key&quot;: &quot;value&quot;}"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">header_rows_definition_fantasy (JSON)</label>
                <textarea
                  value={formData.header_rows_definition_fantasy}
                  onChange={(e) => setFormData({...formData, header_rows_definition_fantasy: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Enter valid JSON, e.g. {&quot;key&quot;: &quot;value&quot;}"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">utg_class</label>
                <input
                  type="text"
                  value={formData.utg_class}
                  onChange={(e) => setFormData({...formData, utg_class: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">is_active</label>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">horomi_active</label>
                <input
                  type="checkbox"
                  checked={formData.horomi_active}
                  onChange={(e) => setFormData({...formData, horomi_active: e.target.checked})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">vertomi_active</label>
                <input
                  type="checkbox"
                  checked={formData.vertomi_active}
                  onChange={(e) => setFormData({...formData, vertomi_active: e.target.checked})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">sort_order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({...formData, sort_order: Number(e.target.value)})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">filters_notes</label>
                <textarea
                  value={formData.filters_notes}
                  onChange={(e) => setFormData({...formData, filters_notes: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Notes about filters..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">pagination_notes</label>
                <textarea
                  value={formData.pagination_notes}
                  onChange={(e) => setFormData({...formData, pagination_notes: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Notes about pagination..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">searchbox_notes</label>
                <textarea
                  value={formData.searchbox_notes}
                  onChange={(e) => setFormData({...formData, searchbox_notes: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Notes about search functionality..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">utg_columns_definition_file_link</label>
                <input
                  type="text"
                  value={formData.utg_columns_definition_file_link}
                  onChange={(e) => setFormData({...formData, utg_columns_definition_file_link: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="vscode://file/path/to/file"
                />
              </div>
            </div>
            
            {/* Bottom save button */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Entry</h2>
            
            {/* Top save button */}
            <div className="mb-6 flex justify-end gap-3 border-b border-gray-200 pb-4">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingRecord(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">utg_name</label>
                <input
                  type="text"
                  value={formData.utg_name}
                  onChange={(e) => setFormData({...formData, utg_name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">utg_columns_definition_location</label>
                <textarea
                  value={formData.utg_columns_definition_location}
                  onChange={(e) => setFormData({...formData, utg_columns_definition_location: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                  rows={6}
                  placeholder="Store large text responses from Claude/Cursor for column definitions..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">utg_description</label>
                <textarea
                  value={formData.utg_description}
                  onChange={(e) => setFormData({...formData, utg_description: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">sheaf_ui_columns_base_foundation</label>
                <textarea
                  value={formData.sheaf_ui_columns_base_foundation}
                  onChange={(e) => setFormData({...formData, sheaf_ui_columns_base_foundation: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                  rows={6}
                  placeholder='{"base_column_order": ["table.column1", "table.column2"], "wolf_exclusion_band": [], "column_groups": {}}'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">monolith_of_ui_columns</label>
                <textarea
                  value={formData.monolith_of_ui_columns}
                  onChange={(e) => setFormData({...formData, monolith_of_ui_columns: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                  rows={6}
                  placeholder="addresspren.addresspren_id&#10;addresspren.fk_addressglub_id&#10;addresspren.address_label&#10;..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">whale_ui_column_definition_source_keys</label>
                <textarea
                  value={formData.whale_ui_column_definition_source_keys}
                  onChange={(e) => setFormData({...formData, whale_ui_column_definition_source_keys: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                  rows={6}
                  placeholder="addresspren_id&#10;fk_addressglub_id&#10;address_label&#10;is_po_box&#10;..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Actual source column keys from table definition. Use 'Analyze' button to auto-populate.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">rel_xpage</label>
                <input
                  type="text"
                  value={formData.rel_xpage}
                  onChange={(e) => setFormData({...formData, rel_xpage: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">main_db_table</label>
                <input
                  type="text"
                  value={formData.main_db_table}
                  onChange={(e) => setFormData({...formData, main_db_table: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">sql_view</label>
                <input
                  type="text"
                  value={formData.sql_view}
                  onChange={(e) => setFormData({...formData, sql_view: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">associated_files (JSON)</label>
                <textarea
                  value={formData.associated_files}
                  onChange={(e) => setFormData({...formData, associated_files: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Enter valid JSON, e.g. {&quot;key&quot;: &quot;value&quot;}"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">header_rows_definition_fantasy (JSON)</label>
                <textarea
                  value={formData.header_rows_definition_fantasy}
                  onChange={(e) => setFormData({...formData, header_rows_definition_fantasy: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Enter valid JSON, e.g. {&quot;key&quot;: &quot;value&quot;}"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">utg_class</label>
                <input
                  type="text"
                  value={formData.utg_class}
                  onChange={(e) => setFormData({...formData, utg_class: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">is_active</label>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">horomi_active</label>
                <input
                  type="checkbox"
                  checked={formData.horomi_active}
                  onChange={(e) => setFormData({...formData, horomi_active: e.target.checked})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">vertomi_active</label>
                <input
                  type="checkbox"
                  checked={formData.vertomi_active}
                  onChange={(e) => setFormData({...formData, vertomi_active: e.target.checked})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">sort_order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({...formData, sort_order: Number(e.target.value)})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">filters_notes</label>
                <textarea
                  value={formData.filters_notes}
                  onChange={(e) => setFormData({...formData, filters_notes: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Notes about filters..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">pagination_notes</label>
                <textarea
                  value={formData.pagination_notes}
                  onChange={(e) => setFormData({...formData, pagination_notes: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Notes about pagination..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">searchbox_notes</label>
                <textarea
                  value={formData.searchbox_notes}
                  onChange={(e) => setFormData({...formData, searchbox_notes: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Notes about search functionality..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">utg_columns_definition_file_link</label>
                <input
                  type="text"
                  value={formData.utg_columns_definition_file_link}
                  onChange={(e) => setFormData({...formData, utg_columns_definition_file_link: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="vscode://file/path/to/file"
                />
              </div>
            </div>
            
            {/* Bottom save button */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingRecord(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Content Viewer/Editor Modal */}
      {isContentViewerOpen && contentViewerData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">{contentViewerData.title}</h2>
              <div className="flex gap-2">
                {!isContentEditing ? (
                  <button
                    onClick={() => setIsContentEditing(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={saveContentFromViewer}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsContentEditing(false);
                        setContentEditValue(contentViewerData.content);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={closeContentViewer}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[400px]">
              {isContentEditing ? (
                <textarea
                  value={contentEditValue}
                  onChange={(e) => setContentEditValue(e.target.value)}
                  className="w-full h-96 font-mono text-sm text-gray-800 bg-white border border-gray-300 rounded p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your content here... (linebreaks and blank lines will be preserved)"
                  style={{ lineHeight: '1.5' }}
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800 leading-relaxed min-h-[350px]">
                  {contentViewerData.content || 'No content available'}
                </pre>
              )}
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Length: {isContentEditing ? contentEditValue.length : contentViewerData.content.length} characters
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigator.clipboard.writeText(isContentEditing ? contentEditValue : contentViewerData.content)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Copy to Clipboard
                </button>
                {isContentEditing && (
                  <button
                    onClick={saveContentFromViewer}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Save Changes
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JSON Editor Modal */}
      {isJsonEditorOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[90vw] h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Sheaf UI Columns Base Foundation Editor
              </h3>
              <button
                onClick={() => {
                  setIsJsonEditorOpen(false);
                  setJsonEditorData(null);
                  setJsonEditValue('');
                }}
                className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded flex items-center justify-center text-lg font-bold"
                title="Close JSON Editor"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="mb-4 flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">JSON Content:</label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(jsonEditValue);
                      alert('JSON copied to clipboard!');
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                  >
                    Copy JSON
                  </button>
                  <button
                    onClick={() => {
                      try {
                        const formatted = JSON.stringify(JSON.parse(jsonEditValue), null, 2);
                        setJsonEditValue(formatted);
                      } catch (e) {
                        alert('Invalid JSON format - cannot format');
                      }
                    }}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded"
                  >
                    Format JSON
                  </button>
                </div>
                <textarea
                  value={jsonEditValue}
                  onChange={(e) => setJsonEditValue(e.target.value)}
                  className="flex-1 w-full p-3 border border-gray-300 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter JSON data here..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => {
                  setIsJsonEditorOpen(false);
                  setJsonEditorData(null);
                  setJsonEditValue('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    let jsonData = null;
                    if (jsonEditValue.trim()) {
                      jsonData = JSON.parse(jsonEditValue);
                    }

                    if (jsonEditorData) {
                      const { error } = await supabase
                        .from('utgs')
                        .update({ sheaf_ui_columns_base_foundation: jsonData })
                        .eq('utg_id', jsonEditorData.recordId);

                      if (error) throw error;

                      // Update local data
                      setData(prevData =>
                        prevData.map(item =>
                          item.utg_id === jsonEditorData.recordId
                            ? { ...item, sheaf_ui_columns_base_foundation: jsonData }
                            : item
                        )
                      );

                      setIsJsonEditorOpen(false);
                      setJsonEditorData(null);
                      setJsonEditValue('');
                      alert('JSON saved successfully!');
                    }
                  } catch (e) {
                    if (e instanceof SyntaxError) {
                      alert('Invalid JSON format. Please check your syntax.');
                    } else {
                      console.error('Error saving JSON:', e);
                      alert('Failed to save JSON data.');
                    }
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Save JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text Editor Modal */}
      {isTextEditorOpen && textEditorData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[95vw] h-[95vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                Text Editor: {textEditorData.fieldName} (Record: {textEditorData.recordId})
              </h3>
              <button
                onClick={() => {
                  setIsTextEditorOpen(false);
                  setTextEditorData(null);
                  setTextEditValue('');
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">
                  {textEditValue.split('\n').length} lines, {textEditValue.length} characters
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(textEditValue);
                      alert('Text copied to clipboard!');
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                  >
                    Copy Text
                  </button>
                  <button
                    onClick={() => {
                      setTextEditValue('');
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <textarea
                value={textEditValue}
                onChange={(e) => setTextEditValue(e.target.value)}
                className="flex-1 w-full p-3 border border-gray-300 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter text data here..."
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => {
                  setIsTextEditorOpen(false);
                  setTextEditorData(null);
                  setTextEditValue('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    if (textEditorData) {
                      const { error } = await supabase
                        .from('utgs')
                        .update({ [textEditorData.fieldName]: textEditValue || null })
                        .eq('utg_id', textEditorData.recordId);

                      if (error) throw error;

                      // Update local data
                      setData(prevData =>
                        prevData.map(item =>
                          item.utg_id === textEditorData.recordId
                            ? { ...item, [textEditorData.fieldName]: textEditValue || null }
                            : item
                        )
                      );

                      setIsTextEditorOpen(false);
                      setTextEditorData(null);
                      setTextEditValue('');
                      alert('Text saved successfully!');
                    }
                  } catch (e) {
                    console.error('Error saving text:', e);
                    alert('Failed to save text data.');
                  }
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                Save Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First UTG ID Warning Modal */}
      {showFirstWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-bold text-red-600 mb-4">⚠️ WARNING: Edit UTG ID</h3>
            <p className="text-gray-700 mb-6">
              You are about to edit a UTG ID. This is a <strong>critical operation</strong> that could break references and relationships in the system.
            </p>
            <p className="text-gray-700 mb-6">
              Are you sure you want to continue?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowFirstWarning(false);
                  setUtgIdWarningData(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowFirstWarning(false);
                  setShowSecondWarning(true);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                I Understand, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Second UTG ID Warning Modal */}
      {showSecondWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-bold text-red-600 mb-4">🚨 FINAL WARNING: Edit UTG ID</h3>
            <p className="text-gray-700 mb-4">
              <strong>This is your final warning!</strong>
            </p>
            <p className="text-gray-700 mb-6">
              Editing the UTG ID could:
              <br />• Break existing references
              <br />• Cause data inconsistencies
              <br />• Affect system functionality
            </p>
            <p className="text-gray-700 mb-6">
              <strong>Are you absolutely certain you want to proceed?</strong>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSecondWarning(false);
                  setUtgIdWarningData(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (utgIdWarningData) {
                    setEditingCell({ id: utgIdWarningData.id, field: utgIdWarningData.field });
                    setEditingValue(utgIdWarningData.value);
                  }
                  setShowSecondWarning(false);
                  setUtgIdWarningData(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                YES, PROCEED WITH EDIT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}