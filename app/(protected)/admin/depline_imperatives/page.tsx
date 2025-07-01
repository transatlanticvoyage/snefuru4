'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface MudAction {
  action_id: string;
  action_category: string;
  action_name: string;
  action_description: string;
  expected_behavior: string;
  current_behavior: string | null;
  status: string;
  priority: number;
  editor_mode: string | null;
  context_notes: string | null;
  test_steps: string | null;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  related_issue_url: string | null;
  is_starred: string | null;
  is_circled: string | null;
  is_squared: string | null;
  is_pentagoned: string | null;
  is_horsed: string | null;
  is_waiting: string | null;
  is_blocked: string | null;
  is_fixed: string | null;
  is_flagged: string | null;
}

export default function DeplineImperativesPage() {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [mudActions, setMudActions] = useState<MudAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<MudAction>>({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newFormData, setNewFormData] = useState<Partial<MudAction>>({
    action_category: '',
    action_name: '',
    action_description: '',
    expected_behavior: '',
    current_behavior: '',
    status: 'pending',
    priority: 3,
    editor_mode: '',
    context_notes: '',
    test_steps: '',
    related_issue_url: ''
  });

  useEffect(() => {
    document.title = 'Depline Imperatives - Admin - Snefuru';
    fetchMudActions();
  }, []);

  const fetchMudActions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mud_actions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMudActions(data || []);
    } catch (err) {
      console.error('Error fetching mud_actions:', err);
      setError('Failed to load actions');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search logic
  const filteredActions = mudActions.filter(action => {
    const matchesSearch = searchTerm === '' || 
      action.action_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.action_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.expected_behavior.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (action.current_behavior || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || action.action_category === filterCategory;
    const matchesStatus = filterStatus === 'all' || action.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredActions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedActions = filteredActions.slice(startIndex, startIndex + itemsPerPage);

  // Get unique categories for filter
  const uniqueCategories = Array.from(new Set(mudActions.map(a => a.action_category)));

  // Handle icon toggles
  const handleIconToggle = async (actionId: string, field: string, currentValue: string | null) => {
    const newValue = currentValue === 'yes' ? null : 'yes';
    
    try {
      const { error } = await supabase
        .from('mud_actions')
        .update({ [field]: newValue })
        .eq('action_id', actionId);

      if (error) throw error;
      
      setMudActions(prev => prev.map(action => 
        action.action_id === actionId ? { ...action, [field]: newValue } : action
      ));
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
    }
  };

  // Handle edit
  const handleEdit = (action: MudAction) => {
    setEditingId(action.action_id);
    setEditFormData(action);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('mud_actions')
        .update(editFormData)
        .eq('action_id', editingId);

      if (error) throw error;
      
      await fetchMudActions();
      setEditingId(null);
      setEditFormData({});
    } catch (err) {
      console.error('Error saving edit:', err);
    }
  };

  // Handle add new
  const handleAddNew = async () => {
    try {
      const { error } = await supabase
        .from('mud_actions')
        .insert([newFormData]);

      if (error) throw error;
      
      await fetchMudActions();
      setIsAddingNew(false);
      setNewFormData({
        action_category: '',
        action_name: '',
        action_description: '',
        expected_behavior: '',
        current_behavior: '',
        status: 'pending',
        priority: 3,
        editor_mode: '',
        context_notes: '',
        test_steps: '',
        related_issue_url: ''
      });
    } catch (err) {
      console.error('Error adding new action:', err);
    }
  };

  // Handle delete
  const handleDelete = async (actionId: string) => {
    if (!confirm('Are you sure you want to delete this action?')) return;

    try {
      const { error } = await supabase
        .from('mud_actions')
        .delete()
        .eq('action_id', actionId);

      if (error) throw error;
      
      await fetchMudActions();
    } catch (err) {
      console.error('Error deleting action:', err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Please log in to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="admin-header bg-blue-600 text-white p-4 mb-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900">Depline Imperatives</h1>
            <p className="text-indigo-600 mt-1">mud_deplines mesagen text and visual editor documentation</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="admin-header bg-blue-600 text-white p-4 mb-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Depline Imperatives</h1>
          <p className="text-indigo-600 mt-1">mud_deplines mesagen text and visual editor documentation</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <input
                type="text"
                placeholder="Search actions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="bug">Bug</option>
              <option value="wontfix">Won't Fix</option>
            </select>
            
            {/* Add New Button */}
            <button
              onClick={() => setIsAddingNew(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add New Action
            </button>
          </div>
          
          {/* Items per page */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded-md"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Add New Form */}
        {isAddingNew && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Add New Action</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Action Category"
                value={newFormData.action_category}
                onChange={(e) => setNewFormData({...newFormData, action_category: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                placeholder="Action Name"
                value={newFormData.action_name}
                onChange={(e) => setNewFormData({...newFormData, action_name: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <textarea
                placeholder="Action Description"
                value={newFormData.action_description}
                onChange={(e) => setNewFormData({...newFormData, action_description: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md col-span-2"
                rows={2}
              />
              <textarea
                placeholder="Expected Behavior"
                value={newFormData.expected_behavior}
                onChange={(e) => setNewFormData({...newFormData, expected_behavior: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md"
                rows={2}
              />
              <textarea
                placeholder="Current Behavior"
                value={newFormData.current_behavior}
                onChange={(e) => setNewFormData({...newFormData, current_behavior: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md"
                rows={2}
              />
              <select
                value={newFormData.status}
                onChange={(e) => setNewFormData({...newFormData, status: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="bug">Bug</option>
                <option value="wontfix">Won't Fix</option>
              </select>
              <input
                type="number"
                placeholder="Priority (1-5)"
                value={newFormData.priority}
                onChange={(e) => setNewFormData({...newFormData, priority: Number(e.target.value)})}
                className="px-3 py-2 border border-gray-300 rounded-md"
                min={1}
                max={5}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleAddNew}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">action_id</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">action_category</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">action_name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">action_description</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">expected_behavior</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">current_behavior</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">priority</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">editor_mode</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">context_notes</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">test_steps</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">created_at</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">updated_at</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">assigned_to</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">related_issue_url</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">is_starred</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">is_circled</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">is_squared</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">is_pentagoned</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">is_horsed</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">is_waiting</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">is_blocked</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">is_fixed</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">is_flagged</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedActions.map((action) => (
                  <tr key={action.action_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{action.action_id.substring(0, 8)}...</td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === action.action_id ? (
                        <input
                          type="text"
                          value={editFormData.action_category}
                          onChange={(e) => setEditFormData({...editFormData, action_category: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        action.action_category
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === action.action_id ? (
                        <input
                          type="text"
                          value={editFormData.action_name}
                          onChange={(e) => setEditFormData({...editFormData, action_name: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        action.action_name
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">
                      {editingId === action.action_id ? (
                        <textarea
                          value={editFormData.action_description}
                          onChange={(e) => setEditFormData({...editFormData, action_description: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          rows={2}
                        />
                      ) : (
                        <span title={action.action_description}>{action.action_description}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">
                      {editingId === action.action_id ? (
                        <textarea
                          value={editFormData.expected_behavior}
                          onChange={(e) => setEditFormData({...editFormData, expected_behavior: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          rows={2}
                        />
                      ) : (
                        <span title={action.expected_behavior}>{action.expected_behavior}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">
                      {editingId === action.action_id ? (
                        <textarea
                          value={editFormData.current_behavior || ''}
                          onChange={(e) => setEditFormData({...editFormData, current_behavior: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          rows={2}
                        />
                      ) : (
                        <span title={action.current_behavior || ''}>{action.current_behavior || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === action.action_id ? (
                        <select
                          value={editFormData.status}
                          onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="bug">Bug</option>
                          <option value="wontfix">Won't Fix</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 text-xs rounded ${
                          action.status === 'completed' ? 'bg-green-100 text-green-800' :
                          action.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          action.status === 'bug' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {action.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === action.action_id ? (
                        <input
                          type="number"
                          value={editFormData.priority}
                          onChange={(e) => setEditFormData({...editFormData, priority: Number(e.target.value)})}
                          className="w-16 px-2 py-1 border border-gray-300 rounded"
                          min={1}
                          max={5}
                        />
                      ) : (
                        action.priority
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === action.action_id ? (
                        <input
                          type="text"
                          value={editFormData.editor_mode || ''}
                          onChange={(e) => setEditFormData({...editFormData, editor_mode: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        action.editor_mode || '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">
                      {editingId === action.action_id ? (
                        <textarea
                          value={editFormData.context_notes || ''}
                          onChange={(e) => setEditFormData({...editFormData, context_notes: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          rows={2}
                        />
                      ) : (
                        <span title={action.context_notes || ''}>{action.context_notes || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">
                      {editingId === action.action_id ? (
                        <textarea
                          value={editFormData.test_steps || ''}
                          onChange={(e) => setEditFormData({...editFormData, test_steps: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          rows={2}
                        />
                      ) : (
                        <span title={action.test_steps || ''}>{action.test_steps || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(action.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(action.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === action.action_id ? (
                        <input
                          type="text"
                          value={editFormData.assigned_to || ''}
                          onChange={(e) => setEditFormData({...editFormData, assigned_to: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        action.assigned_to ? action.assigned_to.substring(0, 8) + '...' : '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">
                      {editingId === action.action_id ? (
                        <input
                          type="text"
                          value={editFormData.related_issue_url || ''}
                          onChange={(e) => setEditFormData({...editFormData, related_issue_url: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        action.related_issue_url ? (
                          <a href={action.related_issue_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Link
                          </a>
                        ) : '-'
                      )}
                    </td>
                    {/* Icon columns */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleIconToggle(action.action_id, 'is_starred', action.is_starred)}
                        className="text-2xl"
                      >
                        {action.is_starred === 'yes' ? '⭐' : '☆'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleIconToggle(action.action_id, 'is_circled', action.is_circled)}
                        className="text-2xl"
                      >
                        {action.is_circled === 'yes' ? '⭕' : '○'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleIconToggle(action.action_id, 'is_squared', action.is_squared)}
                        className="text-2xl"
                      >
                        {action.is_squared === 'yes' ? '⬛' : '□'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleIconToggle(action.action_id, 'is_pentagoned', action.is_pentagoned)}
                        className="text-2xl"
                      >
                        {action.is_pentagoned === 'yes' ? '⬟' : '⬠'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleIconToggle(action.action_id, 'is_horsed', action.is_horsed)}
                        className="text-2xl"
                      >
                        {action.is_horsed === 'yes' ? '🐴' : '🐎'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleIconToggle(action.action_id, 'is_waiting', action.is_waiting)}
                        className="text-2xl"
                      >
                        {action.is_waiting === 'yes' ? '⏳' : '⏰'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleIconToggle(action.action_id, 'is_blocked', action.is_blocked)}
                        className="text-2xl"
                      >
                        {action.is_blocked === 'yes' ? '🚫' : '⛔'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleIconToggle(action.action_id, 'is_fixed', action.is_fixed)}
                        className="text-2xl"
                      >
                        {action.is_fixed === 'yes' ? '✅' : '☑️'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleIconToggle(action.action_id, 'is_flagged', action.is_flagged)}
                        className="text-2xl"
                      >
                        {action.is_flagged === 'yes' ? '🚩' : '⚑'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        {editingId === action.action_id ? (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditFormData({});
                              }}
                              className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(action)}
                              className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(action.action_id)}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredActions.length)} of {filteredActions.length} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}