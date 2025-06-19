"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ApiKeySlot {
  slot_id: string;
  slot_name: string;
  count_active_modules_on_slot: number;
  m1name: string | null;
  m1inuse: boolean;
  m2name: string | null;
  m2inuse: boolean;
  m3name: string | null;
  m3inuse: boolean;
  created_at: string;
  updated_at: string;
  fk_iservices_provider_id: string | null;
  slot_publicly_shown: boolean;
  fk_ai_model_id: string | null;
  is_ai_model: boolean;
}

interface ServiceProvider {
  provider_id: string;
  provider_name: string;
  provider_slug: string;
}

interface AiModel {
  model_id: string;
  model_name: string;
  model_slug: string;
}

interface EditingState {
  [key: string]: Partial<ApiKeySlot>;
}

const columns = [
  'actions',
  'slot_id',
  'slot_name',
  'is_ai_model',
  'count_active_modules_on_slot',
  'm1name',
  'm1inuse',
  'm2name',
  'm2inuse',
  'm3name',
  'm3inuse',
  'created_at',
  'updated_at',
  'fk_iservices_provider_id',
  'slot_publicly_shown',
  'fk_ai_model_id'
];

export default function CreateNewApiKeySlotsPage() {
  const [data, setData] = useState<ApiKeySlot[]>([]);
  const [filteredData, setFilteredData] = useState<ApiKeySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  const [editingData, setEditingData] = useState<EditingState>({});
  const [savingRows, setSavingRows] = useState<Set<string>>(new Set());
  const [newRow, setNewRow] = useState<Partial<ApiKeySlot> | null>(null);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [aiModels, setAiModels] = useState<AiModel[]>([]);
  const [updatingToggles, setUpdatingToggles] = useState<Set<string>>(new Set());
  const [updatingFields, setUpdatingFields] = useState<Set<string>>(new Set());
  
  const pageSizeOptions = [5, 10, 20, 50, 100];
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    document.title = 'API Key Slots Management - Admin - Snefuru';
  }, []);

  useEffect(() => {
    if (user) {
      fetchApiKeySlots();
      fetchProviders();
      fetchAiModels();
    }
  }, [user]);

  useEffect(() => {
    // Filter data based on search term
    if (searchTerm) {
      const filtered = data.filter(item => 
        item.slot_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.m1name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.m2name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.m3name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.slot_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, data]);

  const fetchProviders = async () => {
    try {
      const { data: providersData, error } = await supabase
        .from('iservice_providers')
        .select('provider_id, provider_name, provider_slug')
        .order('provider_name');
      
      if (error) throw error;
      setProviders(providersData || []);
    } catch (err) {
      console.error('Error fetching providers:', err);
    }
  };

  const fetchAiModels = async () => {
    try {
      const { data: modelsData, error } = await supabase
        .from('ai_models')
        .select('model_id, model_name, model_slug')
        .order('model_name');
      
      if (error) throw error;
      setAiModels(modelsData || []);
    } catch (err) {
      console.error('Error fetching AI models:', err);
    }
  };

  const fetchApiKeySlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: slots, error: slotsError } = await supabase
        .from('api_key_slots')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (slotsError) throw slotsError;
      setData(slots || []);
      setFilteredData(slots || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API key slots');
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const totalItems = filteredData.length + (newRow ? 1 : 0);
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  
  // Combine new row with existing data for display
  const displayData = newRow ? [newRow as ApiKeySlot, ...filteredData] : filteredData;
  const currentItems = displayData.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleCreateNewSlot = () => {
    setNewRow({
      slot_id: 'new-' + Date.now(), // Temporary ID
      slot_name: '',
      m1name: '',
      m1inuse: false,
      m2name: '',
      m2inuse: false,
      m3name: '',
      m3inuse: false,
      fk_iservices_provider_id: null,
      slot_publicly_shown: false,
      fk_ai_model_id: null,
      is_ai_model: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    setCurrentPage(1); // Go to first page to see new row
  };

  const handleSaveNewRow = async () => {
    if (!newRow || !newRow.slot_name) {
      setError('Slot name is required');
      return;
    }

    setSavingRows(new Set(['new']));
    try {
      const { slot_id, count_active_modules_on_slot, created_at, updated_at, ...dataToSave } = newRow;
      
      const response = await fetch('/api/admin/f91-create-api-key-slot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create API key slot');
      }

      const result = await response.json();
      
      // Refresh data
      await fetchApiKeySlots();
      setNewRow(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save new API key slot');
    } finally {
      setSavingRows(new Set());
    }
  };

  const handleCancelNewRow = () => {
    setNewRow(null);
    setError(null);
  };

  const handleEdit = (slot: ApiKeySlot) => {
    setEditingRows(new Set([...editingRows, slot.slot_id]));
    setEditingData({
      ...editingData,
      [slot.slot_id]: { ...slot }
    });
  };

  const handleCancel = (slotId: string) => {
    const newEditingRows = new Set(editingRows);
    newEditingRows.delete(slotId);
    setEditingRows(newEditingRows);
    
    const newEditingData = { ...editingData };
    delete newEditingData[slotId];
    setEditingData(newEditingData);
  };

  const handleSave = async (slotId: string) => {
    const editData = editingData[slotId];
    if (!editData || !editData.slot_name) {
      setError('Slot name is required');
      return;
    }

    setSavingRows(new Set([...savingRows, slotId]));
    
    try {
      const { slot_id, count_active_modules_on_slot, created_at, ...dataToUpdate } = editData;
      
      const { error: updateError } = await supabase
        .from('api_key_slots')
        .update({
          ...dataToUpdate,
          updated_at: new Date().toISOString()
        })
        .eq('slot_id', slotId);

      if (updateError) throw updateError;

      // Refresh data
      await fetchApiKeySlots();
      
      // Clear editing state
      handleCancel(slotId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key slot');
    } finally {
      const newSavingRows = new Set(savingRows);
      newSavingRows.delete(slotId);
      setSavingRows(newSavingRows);
    }
  };

  const handleFieldChange = (slotId: string, field: keyof ApiKeySlot, value: any) => {
    if (slotId.startsWith('new-')) {
      setNewRow({
        ...newRow,
        [field]: value
      });
    } else {
      setEditingData({
        ...editingData,
        [slotId]: {
          ...editingData[slotId],
          [field]: value
        }
      });
    }
  };

  const handleToggleField = async (slotId: string, field: string, currentValue: boolean) => {
    const toggleKey = `${slotId}-${field}`;
    setUpdatingToggles(new Set([...updatingToggles, toggleKey]));
    
    try {
      const { error } = await supabase
        .from('api_key_slots')
        .update({
          [field]: !currentValue,
          updated_at: new Date().toISOString()
        })
        .eq('slot_id', slotId);

      if (error) throw error;

      // Update local data optimistically
      setData(prevData => 
        prevData.map(slot => 
          slot.slot_id === slotId 
            ? { ...slot, [field]: !currentValue, updated_at: new Date().toISOString() }
            : slot
        )
      );
      
      setFilteredData(prevData => 
        prevData.map(slot => 
          slot.slot_id === slotId 
            ? { ...slot, [field]: !currentValue, updated_at: new Date().toISOString() }
            : slot
        )
      );
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to update ${field}`);
    } finally {
      const newUpdatingToggles = new Set(updatingToggles);
      newUpdatingToggles.delete(toggleKey);
      setUpdatingToggles(newUpdatingToggles);
    }
  };

  const handleTextFieldUpdate = async (slotId: string, field: string, value: string) => {
    const fieldKey = `${slotId}-${field}`;
    setUpdatingFields(new Set([...updatingFields, fieldKey]));
    
    try {
      const { error } = await supabase
        .from('api_key_slots')
        .update({
          [field]: value || null,
          updated_at: new Date().toISOString()
        })
        .eq('slot_id', slotId);

      if (error) throw error;

      // Update local data optimistically
      setData(prevData => 
        prevData.map(slot => 
          slot.slot_id === slotId 
            ? { ...slot, [field]: value || null, updated_at: new Date().toISOString() }
            : slot
        )
      );
      
      setFilteredData(prevData => 
        prevData.map(slot => 
          slot.slot_id === slotId 
            ? { ...slot, [field]: value || null, updated_at: new Date().toISOString() }
            : slot
        )
      );
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to update ${field}`);
    } finally {
      const newUpdatingFields = new Set(updatingFields);
      newUpdatingFields.delete(fieldKey);
      setUpdatingFields(newUpdatingFields);
    }
  };

  const formatColumnData = (col: string, value: any, slot: ApiKeySlot) => {
    // Don't return '-' early for fields that should always show text inputs
    const alwaysEditableFields = ['m1name', 'm2name', 'm3name', 'fk_iservices_provider_id', 'fk_ai_model_id'];
    if ((value === null || value === undefined) && !alwaysEditableFields.includes(col)) return '-';
    
    const isEditing = editingRows.has(slot.slot_id) || slot.slot_id.startsWith('new-');
    const editData = slot.slot_id.startsWith('new-') ? newRow : editingData[slot.slot_id];
    
    switch (col) {
      case 'slot_id':
        return slot.slot_id.startsWith('new-') ? 'New' : value.substring(0, 8) + '...';
      
      case 'slot_name':
        if (isEditing) {
          return (
            <input
              type="text"
              value={editData?.slot_name || ''}
              onChange={(e) => handleFieldChange(slot.slot_id, 'slot_name', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter slot name"
              required
            />
          );
        }
        return value;
      
      case 'count_active_modules_on_slot':
        // Calculate based on current editing values if editing
        if (isEditing && editData) {
          const count = (editData.m1inuse ? 1 : 0) + 
                       (editData.m2inuse ? 1 : 0) + 
                       (editData.m3inuse ? 1 : 0);
          return count;
        }
        return value || 0;
      
      case 'm1name':
      case 'm2name':
      case 'm3name':
        if (isEditing) {
          return (
            <input
              type="text"
              value={editData?.[col] || ''}
              onChange={(e) => handleFieldChange(slot.slot_id, col, e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder={`Module ${col.charAt(1)} name`}
            />
          );
        }
        
        // Always-editable text field
        const fieldKey = `${slot.slot_id}-${col}`;
        const fieldIsUpdating = updatingFields.has(fieldKey);
        return (
          <div className="relative">
            <input
              type="text"
              defaultValue={value || ''}
              onBlur={(e) => {
                if (e.target.value !== (value || '')) {
                  handleTextFieldUpdate(slot.slot_id, col, e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              disabled={fieldIsUpdating}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={`Module ${col.charAt(1)} name`}
            />
            {fieldIsUpdating && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
              </div>
            )}
          </div>
        );
      
      case 'm1inuse':
      case 'm2inuse':
      case 'm3inuse':
        if (isEditing) {
          return (
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => handleFieldChange(slot.slot_id, col, !editData?.[col])}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  editData?.[col] ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                    editData?.[col] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          );
        }
        
        // For non-editing rows, make toggle functional with instant update
        const moduleToggleKey = `${slot.slot_id}-${col}`;
        const moduleIsUpdating = updatingToggles.has(moduleToggleKey);
        return (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => !moduleIsUpdating && handleToggleField(slot.slot_id, col, value)}
              disabled={moduleIsUpdating}
              className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                value ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                  value ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
              {moduleIsUpdating && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                </div>
              )}
            </button>
          </div>
        );
      
      case 'slot_publicly_shown':
        if (isEditing) {
          return (
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => handleFieldChange(slot.slot_id, 'slot_publicly_shown', !editData?.slot_publicly_shown)}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  editData?.slot_publicly_shown ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                    editData?.slot_publicly_shown ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          );
        }
        
        // Always clickable toggle for public/private
        const publicToggleKey = `${slot.slot_id}-slot_publicly_shown`;
        const publicIsUpdating = updatingToggles.has(publicToggleKey);
        return (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => !publicIsUpdating && handleToggleField(slot.slot_id, 'slot_publicly_shown', value)}
              disabled={publicIsUpdating}
              className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                value ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                  value ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
              {publicIsUpdating && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                </div>
              )}
            </button>
            <span className={`ml-2 text-xs font-medium ${
              value ? 'text-blue-800' : 'text-gray-600'
            }`}>
              {value ? 'Public' : 'Private'}
            </span>
          </div>
        );
      
      case 'is_ai_model':
        if (isEditing) {
          return (
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => handleFieldChange(slot.slot_id, 'is_ai_model', !editData?.is_ai_model)}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  editData?.is_ai_model ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                    editData?.is_ai_model ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          );
        }
        
        // For non-editing rows, make toggle functional with instant update
        const aiModelToggleKey = `${slot.slot_id}-is_ai_model`;
        const aiModelIsUpdating = updatingToggles.has(aiModelToggleKey);
        return (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => !aiModelIsUpdating && handleToggleField(slot.slot_id, 'is_ai_model', value)}
              disabled={aiModelIsUpdating}
              className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                value ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                  value ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
              {aiModelIsUpdating && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                </div>
              )}
            </button>
          </div>
        );
      
      case 'fk_iservices_provider_id':
        if (isEditing) {
          return (
            <select
              value={editData?.fk_iservices_provider_id || ''}
              onChange={(e) => handleFieldChange(slot.slot_id, 'fk_iservices_provider_id', e.target.value || null)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">None</option>
              {providers.map(provider => (
                <option key={provider.provider_id} value={provider.provider_id}>
                  {provider.provider_name}
                </option>
              ))}
            </select>
          );
        }
        
        // Always-editable text field for UUID input
        const providerFieldKey = `${slot.slot_id}-fk_iservices_provider_id`;
        const providerFieldIsUpdating = updatingFields.has(providerFieldKey);
        return (
          <div className="relative">
            <input
              type="text"
              defaultValue={value || ''}
              onBlur={(e) => {
                if (e.target.value !== (value || '')) {
                  handleTextFieldUpdate(slot.slot_id, 'fk_iservices_provider_id', e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              disabled={providerFieldIsUpdating}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Provider UUID (e.g. 79f1a2d4-ec7e-4f3a-a896-d2e4d0e2d3ba)"
            />
            {providerFieldIsUpdating && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
              </div>
            )}
          </div>
        );
      
      case 'fk_ai_model_id':
        if (isEditing) {
          return (
            <select
              value={editData?.fk_ai_model_id || ''}
              onChange={(e) => handleFieldChange(slot.slot_id, 'fk_ai_model_id', e.target.value || null)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">None</option>
              {aiModels.map(model => (
                <option key={model.model_id} value={model.model_id}>
                  {model.model_name}
                </option>
              ))}
            </select>
          );
        }
        
        // Always-editable text field for UUID input
        const aiModelFieldKey = `${slot.slot_id}-fk_ai_model_id`;
        const aiModelFieldIsUpdating = updatingFields.has(aiModelFieldKey);
        return (
          <div className="relative">
            <input
              type="text"
              defaultValue={value || ''}
              onBlur={(e) => {
                if (e.target.value !== (value || '')) {
                  handleTextFieldUpdate(slot.slot_id, 'fk_ai_model_id', e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              disabled={aiModelFieldIsUpdating}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="AI Model UUID (e.g. 79f1a2d4-ec7e-4f3a-a896-d2e4d0e2d3ba)"
            />
            {aiModelFieldIsUpdating && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
              </div>
            )}
          </div>
        );
      
      case 'created_at':
      case 'updated_at':
        return new Date(value).toLocaleString();
      
      default:
        return String(value);
    }
  };

  const getColumnDisplayName = (col: string) => {
    return col; // Return the exact column name as specified
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, currentPage + halfVisible);
      
      if (startPage === 1) {
        endPage = Math.min(totalPages, maxVisiblePages);
      }
      
      if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - maxVisiblePages + 1);
      }
      
      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) {
          pageNumbers.push('...');
        }
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push('...');
        }
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  if (loading) return <div className="p-6">Loading API key slots...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">API Key Slots Management</h1>
      <p className="text-sm text-gray-600 mb-6"><span className="font-bold">db table:</span> api_key_slots</p>
      
      {/* Create New Slot Button */}
      <div className="mb-6">
        <button
          onClick={handleCreateNewSlot}
          disabled={!!newRow}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          f91 create new api key slot
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      
      {/* Search and Filter Section */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search API Key Slots</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search by slot name, module names, or ID..."
              />
            </div>
          </div>
          <button
            onClick={fetchApiKeySlots}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing <span className="font-medium text-gray-900">{startIndex + 1}</span> to{' '}
            <span className="font-medium text-gray-900">{endIndex}</span> of{' '}
            <span className="font-medium text-gray-900">{totalItems}</span> API key slots
          </span>
          <div className="flex items-center space-x-2">
            <label htmlFor="pageSize" className="text-sm font-medium text-gray-700">
              Items per page:
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
                <th 
                  key={col} 
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 lowercase tracking-wider"
                >
                  {getColumnDisplayName(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((slot, index) => {
              const isNewRow = slot.slot_id.startsWith('new-');
              const isEditing = editingRows.has(slot.slot_id) || isNewRow;
              
              return (
                <tr 
                  key={slot.slot_id} 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isNewRow ? 'bg-yellow-50' : ''}`}
                >
                  {columns.map(col => (
                    <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {col === 'actions' ? (
                        <div className="flex space-x-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => isNewRow ? handleSaveNewRow() : handleSave(slot.slot_id)}
                                disabled={savingRows.has(isNewRow ? 'new' : slot.slot_id)}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {savingRows.has(isNewRow ? 'new' : slot.slot_id) ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={() => isNewRow ? handleCancelNewRow() : handleCancel(slot.slot_id)}
                                disabled={savingRows.has(isNewRow ? 'new' : slot.slot_id)}
                                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleEdit(slot)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="max-w-xs">
                          {formatColumnData(col, slot[col as keyof ApiKeySlot], slot)}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center">
          <p className="text-sm text-gray-700">
            Page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="First Page"
          >
            <span className="sr-only">First</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous Page"
          >
            <span className="sr-only">Previous</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          {getPageNumbers().map((pageNum, index) => (
            <span key={index}>
              {pageNum === '...' ? (
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500">
                  ...
                </span>
              ) : (
                <button
                  onClick={() => handlePageChange(pageNum as number)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    currentPage === pageNum
                      ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              )}
            </span>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next Page"
          >
            <span className="sr-only">Next</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Last Page"
          >
            <span className="sr-only">Last</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0zm-6 0a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {displayData.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No API key slots found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No API key slots match your search criteria.' : 'Click the button above to create your first API key slot.'}
          </p>
        </div>
      )}
    </div>
  );
}