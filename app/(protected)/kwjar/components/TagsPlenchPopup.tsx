'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';
import dynamic from 'next/dynamic';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

interface KeywordTag {
  tag_id: number;
  tag_name: string;
  tag_order: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  keyword_count?: number;
}

interface TagsPlenchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTag: (tag: { tag_id: number; tag_name: string }) => void;
  selectedTag: { tag_id: number; tag_name: string } | null;
}

const columns = [
  { key: 'keyword_count', label: 'count of keywords', type: 'number', width: '120px' },
  { key: 'filter', label: 'Filter', type: 'action', width: '80px' },
  { key: 'tag_id', label: 'tag_id', type: 'number', width: '80px' },
  { key: 'tag_name', label: 'tag_name', type: 'text', width: '200px' },
  { key: 'tag_order', label: 'tag_order', type: 'number', width: '100px' },
  { key: 'created_at', label: 'created_at', type: 'datetime', width: '180px' },
  { key: 'updated_at', label: 'updated_at', type: 'datetime', width: '180px' },
  { key: 'user_id', label: 'user_id', type: 'text', width: '200px' }
];

export default function TagsPlenchPopup({ isOpen, onClose, onSelectTag, selectedTag }: TagsPlenchPopupProps) {
  const { user } = useAuth();
  const [data, setData] = useState<KeywordTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [sortField, setSortField] = useState<keyof KeywordTag>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const supabase = createClientComponentClient();

  // Get user ID
  const [userInternalId, setUserInternalId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      if (user?.id) {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();
        
        if (userData) {
          setUserInternalId(userData.id);
        }
      }
    };
    getUserId();
  }, [user, supabase]);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (!userInternalId) return;

      const { data: tags, error } = await supabase
        .from('keywordshub_tags')
        .select('*')
        .eq('user_id', userInternalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (tags && tags.length > 0) {
        // Get keyword counts for each tag
        const tagIds = tags.map(tag => tag.tag_id);
        
        const { data: tagCounts, error: countError } = await supabase
          .from('keywordshub_tag_relations')
          .select('fk_tag_id')
          .in('fk_tag_id', tagIds);
        
        if (countError) {
          console.error('Error fetching tag counts:', countError);
        }
        
        // Count keywords per tag
        const countsByTagId: Record<number, number> = {};
        if (tagCounts) {
          tagCounts.forEach(relation => {
            const tagId = relation.fk_tag_id;
            countsByTagId[tagId] = (countsByTagId[tagId] || 0) + 1;
          });
        }
        
        // Add keyword counts to tags
        const tagsWithCounts = tags.map(tag => ({
          ...tag,
          keyword_count: countsByTagId[tag.tag_id] || 0
        }));
        
        setData(tagsWithCounts);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Error fetching tags:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userInternalId) {
      fetchData();
    }
  }, [isOpen, userInternalId]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => {
      if (!searchTerm) return true;
      return Object.values(item).some(value => 
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    // Sort data
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortOrder === 'asc' ? -1 : 1;
      if (bValue === null) return sortOrder === 'asc' ? 1 : -1;
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, searchTerm, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  // Handle sort
  const handleSort = (field: keyof KeywordTag) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle filter button click
  const handleFilter = (tag: KeywordTag) => {
    onSelectTag({ tag_id: tag.tag_id, tag_name: tag.tag_name });
  };

  // Render cell content
  const renderCell = (item: KeywordTag, column: typeof columns[0]) => {
    if (column.key === 'filter') {
      return (
        <button
          onClick={() => handleFilter(item)}
          className="bg-black text-white px-3 py-1 rounded text-xs font-medium hover:bg-gray-800 transition-colors"
        >
          filter
        </button>
      );
    }

    const value = item[column.key as keyof KeywordTag];
    
    if (column.type === 'datetime' && value) {
      return (
        <div className="px-2 py-1 text-xs">
          {new Date(value as string).toLocaleString()}
        </div>
      );
    }

    if (column.type === 'number' && value !== null) {
      return (
        <div className="px-2 py-1 text-xs">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      );
    }

    return (
      <div className="px-2 py-1 text-xs">
        {value?.toString() || ''}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl" style={{ width: '1000px', height: '800px' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Tags Plench</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-4">
            <NubraTablefaceKite text="tags-table-kite" />
            <div className="relative">
              <input
                type="text"
                placeholder="Search tags..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-60 px-3 py-2 pr-12 border border-gray-300 rounded-md text-sm"
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
            {selectedTag && (
              <div className="text-sm text-purple-600 font-medium">
                Current filter: {selectedTag.tag_name}
              </div>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-hidden" style={{ height: 'calc(800px - 140px)' }}>
          <div className="h-full overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading tags...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-red-500">Error: {error}</div>
              </div>
            ) : (
              <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  {/* Table name header */}
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={`header-${column.key}`}
                        className="px-2 py-3 text-left border border-gray-200 bg-[#bcc4f1]"
                        style={{ width: column.width }}
                      >
                        <span className="font-bold text-xs">keywordshub_tags</span>
                      </th>
                    ))}
                  </tr>
                  {/* Column headers */}
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className={`px-2 py-3 text-left border border-gray-200 ${
                          column.key === 'filter' ? '' : 'cursor-pointer hover:bg-gray-100'
                        }`}
                        style={{ width: column.width }}
                        onClick={() => column.key !== 'filter' && handleSort(column.key as keyof KeywordTag)}
                      >
                        <div className="flex items-center space-x-1">
                          <span className="font-bold text-xs lowercase">{column.label}</span>
                          {column.key !== 'filter' && sortField === column.key && (
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
                    <tr key={item.tag_id} className="hover:bg-gray-50">
                      {columns.map((column) => (
                        <td 
                          key={column.key} 
                          className="border border-gray-200"
                          style={{ width: column.width }}
                        >
                          {renderCell(item, column)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer with pagination info */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} tags
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}