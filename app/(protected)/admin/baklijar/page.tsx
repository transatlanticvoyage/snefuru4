'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

interface BakliMockup {
  bakli_id: string;
  bakli_name: string;
  bakli_description: string | null;
  bakli_status: string;
  bakli_folder: string | null;
  bakli_tags: string[] | null;
  is_public: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  last_viewed_at: string | null;
  bakli_priority: number;
}

export default function BaklijarPage() {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [mockups, setMockups] = useState<BakliMockup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFolder, setFilterFolder] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(200);
  const [isCreating, setIsCreating] = useState(false);
  const [newMockupName, setNewMockupName] = useState('');

  useEffect(() => {
    document.title = 'Bakli Mockups - Admin - Snefuru';
    fetchMockups();
  }, []);

  const fetchMockups = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      // Get user's internal ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!userData) {
        setError('User not found');
        return;
      }

      // Fetch user's mockups
      const { data, error } = await supabase
        .from('bakli_mockups')
        .select('*')
        .eq('fk_user_id', userData.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setMockups(data || []);
    } catch (err) {
      console.error('Error fetching mockups:', err);
      setError('Failed to load mockups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    if (!newMockupName.trim()) {
      alert('Please enter a name for the new mockup');
      return;
    }

    setIsCreating(true);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Get user's internal ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!userData) {
        throw new Error('User not found');
      }

      const { data, error } = await supabase
        .from('bakli_mockups')
        .insert([{
          fk_user_id: userData.id,
          bakli_name: newMockupName.trim(),
          bakli_content: '<div>\n  <h1>Hello World</h1>\n  <p>Start building your mockup here...</p>\n</div>',
          bakli_css: '/* Add your CSS styles here */\nh1 {\n  color: #333;\n  font-family: Arial, sans-serif;\n}\n\np {\n  color: #666;\n  line-height: 1.6;\n}'
        }])
        .select()
        .single();

      if (error) throw error;

      setNewMockupName('');
      await fetchMockups();

      // Navigate to the new mockup
      if (data) {
        window.location.href = `/admin/baklivid?bakli_id=${data.bakli_id}`;
      }
    } catch (err) {
      console.error('Error creating mockup:', err);
      alert('Failed to create new mockup');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (bakliId: string, mockupName: string) => {
    if (!confirm(`Are you sure you want to delete "${mockupName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('bakli_mockups')
        .delete()
        .eq('bakli_id', bakliId);

      if (error) throw error;
      
      await fetchMockups();
      alert('Mockup deleted successfully');
    } catch (err) {
      console.error('Error deleting mockup:', err);
      alert('Failed to delete mockup');
    }
  };

  // Filter and search logic
  const filteredMockups = mockups.filter(mockup => {
    const matchesSearch = searchTerm === '' || 
      mockup.bakli_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mockup.bakli_description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || mockup.bakli_status === filterStatus;
    const matchesFolder = filterFolder === 'all' || mockup.bakli_folder === filterFolder;
    
    return matchesSearch && matchesStatus && matchesFolder;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMockups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMockups = filteredMockups.slice(startIndex, startIndex + itemsPerPage);

  // Get unique folders for filter
  const uniqueFolders = Array.from(new Set(mockups.map(m => m.bakli_folder).filter(Boolean)));

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Please log in to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading mockups...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-purple-600 text-white p-4 mb-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">Bakli Mockups</h1>
          <p className="mt-1 opacity-90">HTML/CSS Mockup Creation System</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Controls */}
        <div className="mb-6 space-y-4">
          {/* Create New Section */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-3">Create New Mockup</h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter mockup name..."
                value={newMockupName}
                onChange={(e) => setNewMockupName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateNew()}
              />
              <button
                onClick={handleCreateNew}
                disabled={isCreating || !newMockupName.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create New'}
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <input
                type="text"
                placeholder="Search mockups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            
            <select
              value={filterFolder}
              onChange={(e) => setFilterFolder(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Folders</option>
              {uniqueFolders.map(folder => (
                <option key={folder} value={folder || ''}>{folder}</option>
              ))}
            </select>
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

        {/* Mockups Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 lowercase border border-gray-200">link</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 lowercase border border-gray-200">bakli_name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 lowercase border border-gray-200">bakli_description</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 lowercase border border-gray-200">bakli_status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 lowercase border border-gray-200">bakli_folder</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 lowercase border border-gray-200">view_count</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 lowercase border border-gray-200">updated_at</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 lowercase border border-gray-200">actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {paginatedMockups.map((mockup) => (
                  <tr key={mockup.bakli_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border border-gray-200">
                      <Link 
                        href={`/admin/baklivid?bakli_id=${mockup.bakli_id}`}
                        className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                      >
                        Edit
                      </Link>
                    </td>
                    <td className="px-4 py-3 border border-gray-200">
                      <Link 
                        href={`/admin/baklivid?bakli_id=${mockup.bakli_id}`}
                        className="text-purple-600 hover:text-purple-800 font-medium"
                      >
                        {mockup.bakli_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate border border-gray-200">
                      {mockup.bakli_description || '-'}
                    </td>
                    <td className="px-4 py-3 border border-gray-200">
                      <span className={`px-2 py-1 text-xs rounded ${
                        mockup.bakli_status === 'published' ? 'bg-green-100 text-green-800' :
                        mockup.bakli_status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {mockup.bakli_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 border border-gray-200">
                      {mockup.bakli_folder || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 border border-gray-200">
                      {mockup.view_count}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 border border-gray-200">
                      {new Date(mockup.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 border border-gray-200">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/baklivid?bakli_id=${mockup.bakli_id}`}
                          className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(mockup.bakli_id, mockup.bakli_name)}
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedMockups.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 border border-gray-200">
                      {filteredMockups.length === 0 ? 'No mockups found' : 'No mockups match your filters'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredMockups.length)} of {filteredMockups.length} results
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
        )}
      </div>
    </div>
  );
}