'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

interface KeywordTag {
  tag_id: number;
  tag_name: string;
  tag_order: number;
  created_at: string;
  updated_at: string;
  is_starred: boolean | null;
  keyword_count?: number;
  rel_tag_group?: number | null;
  group_name?: string;
  qty_starred?: number;
  qty_chosen?: number;
}

interface KeywordTagGroup {
  group_id: number;
  group_name: string;
  group_description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  is_starred: boolean | null;
  tag_count?: number;
}

interface TagsPlenchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTag: (tag: { tag_id: number; tag_name: string }) => void;
  selectedTag: { tag_id: number; tag_name: string } | null;
}

const tagsColumns = [
  { key: 'checkbox', label: 'checkbox', type: 'checkbox', width: '60px' },
  { key: 'keyword_count', label: 'count of keywords', type: 'number', width: '1px', shrinkColumn: true },
  { key: 'group_name', label: 'group', type: 'text', width: '150px' },
  { key: 'filter', label: 'Filter', type: 'action', width: '80px' },
  { key: 'tag_id', label: 'tag_id', type: 'number', width: '80px' },
  { key: 'is_starred', label: 'str.', type: 'star', width: '60px', headerRow1Text: 'keywordshub_tags', headerRow2Text: 'str.' },
  { key: 'tag_name', label: 'tag_name', type: 'text', width: '200px' },
  { key: 'qty_starred', label: 'qty_starred', type: 'number', width: '1px', shrinkColumn: true },
  { key: 'qty_chosen', label: 'qty_chosen', type: 'number', width: '1px', shrinkColumn: true },
  { key: 'tag_order', label: 'tag_order', type: 'number', width: '100px' },
  { key: 'created_at', label: 'created_at', type: 'datetime', width: '180px' },
  { key: 'updated_at', label: 'updated_at', type: 'datetime', width: '180px' }
] as const;

const groupsColumns = [
  { key: 'checkbox', label: 'checkbox', type: 'checkbox', width: '60px' },
  { key: 'tag_count', label: 'count of tags', type: 'number', width: '120px' },
  { key: 'edit', label: 'Edit', type: 'action', width: '80px' },
  { key: 'delete', label: 'Delete', type: 'action', width: '80px' },
  { key: 'group_id', label: 'group_id', type: 'number', width: '80px' },
  { key: 'group_name', label: 'group_name', type: 'text', width: '200px' },
  { key: 'group_description', label: 'group_description', type: 'text', width: '250px' },
  { key: 'is_starred', label: 'str.', type: 'star', width: '60px', headerRow1Text: 'keywordshub_tag_groups', headerRow2Text: 'str.' },
  { key: 'display_order', label: 'display_order', type: 'number', width: '100px' },
  { key: 'created_at', label: 'created_at', type: 'datetime', width: '180px' },
  { key: 'updated_at', label: 'updated_at', type: 'datetime', width: '180px' }
] as const;

export default function TagsPlenchPopup({ isOpen, onClose, onSelectTag, selectedTag }: TagsPlenchPopupProps) {
  const { user } = useAuth();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedTagForDelete, setSelectedTagForDelete] = useState<KeywordTag | null>(null);
  const [scanResults, setScanResults] = useState<{ total: number; shared: number } | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Column shrinkage CSS styles
  const shrinkageStyles = `
    .tags-plench-table {
      table-layout: auto !important;
    }
    
    .tags-plench-table th,
    .tags-plench-table td {
      white-space: nowrap !important;
      width: auto !important;
    }
    
    .tags-plench-table .for_db_column_keyword_count,
    .tags-plench-table .for_db_column_qty_starred,
    .tags-plench-table .for_db_column_qty_chosen {
      width: 1px !important;
      white-space: nowrap !important;
      position: relative;
    }

    .tags-plench-table td.for_db_column_keyword_count .cell_inner_wrapper_div,
    .tags-plench-table td.for_db_column_qty_starred .cell_inner_wrapper_div,
    .tags-plench-table td.for_db_column_qty_chosen .cell_inner_wrapper_div {
      white-space: nowrap !important;
      padding: 4px 8px !important;
      min-width: fit-content !important;
      text-align: left !important;
      justify-content: flex-start !important;
      display: block !important;
    }

    .tags-plench-table th.for_db_column_keyword_count,
    .tags-plench-table th.for_db_column_qty_starred,
    .tags-plench-table th.for_db_column_qty_chosen {
      position: relative !important;
      overflow: hidden !important;
      max-width: 0 !important;
      width: 1px !important;
    }

    .tags-plench-table th.for_db_column_keyword_count .cell_inner_wrapper_div,
    .tags-plench-table th.for_db_column_qty_starred .cell_inner_wrapper_div,
    .tags-plench-table th.for_db_column_qty_chosen .cell_inner_wrapper_div {
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: clip !important;
      display: block !important;
      padding: 4px 8px !important;
      min-width: 0 !important;
    }

    /* Sticky header base z-index and opaque backgrounds */
    .tags-plench-table thead {
      z-index: 100;
      position: relative;
    }
    
    .tags-plench-table th {
      z-index: 110;
      background-color: #f9fafb !important; /* Completely opaque gray-50 equivalent */
      position: relative;
    }
    
    /* First header row - table name row */
    .tags-plench-table thead tr:first-child th {
      background-color: #bcc4f1 !important; /* Completely opaque blue background */
      z-index: 115;
    }
    
    /* Second header row - column name row */
    .tags-plench-table thead tr:last-child th {
      background-color: #f9fafb !important; /* Completely opaque gray background */
      z-index: 114;
    }
    
    /* Shrinkage column z-index (lower than headers) */
    .tags-plench-table th.for_db_column_keyword_count,
    .tags-plench-table td.for_db_column_keyword_count { z-index: 101; }
    .tags-plench-table th.for_db_column_qty_starred,
    .tags-plench-table td.for_db_column_qty_starred { z-index: 102; }
    .tags-plench-table th.for_db_column_qty_chosen,
    .tags-plench-table td.for_db_column_qty_chosen { z-index: 103; }
    
    /* Ensure sticky headers override shrinkage columns with opaque backgrounds */
    .tags-plench-table thead tr:first-child th.for_db_column_keyword_count { 
      z-index: 116; 
      background-color: #bcc4f1 !important; 
      position: relative;
    }
    .tags-plench-table thead tr:first-child th.for_db_column_qty_starred { 
      z-index: 117; 
      background-color: #bcc4f1 !important; 
      position: relative;
    }
    .tags-plench-table thead tr:first-child th.for_db_column_qty_chosen { 
      z-index: 118; 
      background-color: #bcc4f1 !important; 
      position: relative;
    }
    
    .tags-plench-table thead tr:last-child th.for_db_column_keyword_count { 
      z-index: 119; 
      background-color: #f9fafb !important; 
      position: relative;
    }
    .tags-plench-table thead tr:last-child th.for_db_column_qty_starred { 
      z-index: 120; 
      background-color: #f9fafb !important; 
      position: relative;
    }
    .tags-plench-table thead tr:last-child th.for_db_column_qty_chosen { 
      z-index: 121; 
      background-color: #f9fafb !important; 
      position: relative;
    }
  `;
  // Tags state
  const [data, setData] = useState<KeywordTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [sortField, setSortField] = useState<keyof KeywordTag>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [groupFilter, setGroupFilter] = useState('all');
  const [isStarredFilter, setIsStarredFilter] = useState('all');
  
  // Groups state
  const [groupsData, setGroupsData] = useState<KeywordTagGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [groupsSearchTerm, setGroupsSearchTerm] = useState('');
  const [groupsCurrentPage, setGroupsCurrentPage] = useState(1);
  const [groupsItemsPerPage, setGroupsItemsPerPage] = useState(50);
  const [groupsSortField, setGroupsSortField] = useState<keyof KeywordTagGroup>('created_at');
  const [groupsSortOrder, setGroupsSortOrder] = useState<'asc' | 'desc'>('desc');
  const [groupsSelectedRows, setGroupsSelectedRows] = useState<Set<number>>(new Set());
  const [groupsSelectAll, setGroupsSelectAll] = useState(false);
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  
  const [activeTab, setActiveTab] = useState<'tags' | 'groups'>('tags');

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

      // Try to fetch tags with groups, but fall back to tags only if groups table doesn't exist
      let tags, error;
      try {
        const result = await supabase
          .from('keywordshub_tags')
          .select(`
            *,
            keywordshub_tag_groups!rel_tag_group (
              group_name
            )
          `)
          .eq('user_id', userInternalId)
          .order('created_at', { ascending: false });
        
        tags = result.data;
        error = result.error;
      } catch (joinError) {
        console.warn('Failed to fetch tags with groups, falling back to tags only:', joinError);
        // Fallback to basic tags query without groups
        const result = await supabase
          .from('keywordshub_tags')
          .select('*')
          .eq('user_id', userInternalId)
          .order('created_at', { ascending: false });
        
        tags = result.data;
        error = result.error;
      }

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
        
        // Add keyword counts and group names to tags
        const tagsWithCounts = tags.map(tag => ({
          ...tag,
          keyword_count: countsByTagId[tag.tag_id] || 0,
          group_name: tag.keywordshub_tag_groups?.group_name || null
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

  // Fetch groups data
  const fetchGroupsData = async () => {
    try {
      setGroupsLoading(true);
      setGroupsError(null); // Clear any previous errors
      
      if (!userInternalId) {
        console.log('No userInternalId for groups fetch');
        setGroupsLoading(false);
        return;
      }

      console.log('Fetching groups for userInternalId:', userInternalId);

      // First check the structure of the table
      const { data: allGroups, error: allError } = await supabase
        .from('keywordshub_tag_groups')
        .select('*')
        .limit(1);
      
      console.log('Test query (all groups, limit 1):', { allGroups, allError });
      
      // Check what columns exist in the first row
      if (allGroups && allGroups.length > 0) {
        console.log('Available columns in keywordshub_tag_groups:', Object.keys(allGroups[0]));
      }

      // For now, let's try without the user filter since user_id column doesn't exist
      const { data: groups, error } = await supabase
        .from('keywordshub_tag_groups')
        .select('*')
        // .eq('user_id', userInternalId)  // Commented out - column doesn't exist
        .order('created_at', { ascending: false });

      console.log('Groups query result:', { groups, error });

      if (error) {
        console.error('Supabase error fetching groups:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          error
        });
        // Don't throw, just set error state
        setGroupsError(error.message || 'Failed to fetch groups');
        setGroupsLoading(false);
        return;
      }

      console.log('Groups fetched successfully:', groups);
      
      if (groups && groups.length > 0) {
        // Get tag counts for each group
        const groupIds = groups.map(group => group.group_id);
        
        const { data: tagCounts, error: countError } = await supabase
          .from('keywordshub_tags')
          .select('rel_tag_group')
          .in('rel_tag_group', groupIds)
          .eq('user_id', userInternalId);  // This should work since keywordshub_tags has user_id
        
        if (countError) {
          console.error('Error fetching group tag counts:', countError);
        }
        
        // Count tags per group
        const countsByGroupId: Record<number, number> = {};
        if (tagCounts) {
          tagCounts.forEach(tag => {
            const groupId = tag.rel_tag_group;
            if (groupId) {
              countsByGroupId[groupId] = (countsByGroupId[groupId] || 0) + 1;
            }
          });
        }
        
        // Add tag counts to groups
        const groupsWithCounts = groups.map(group => ({
          ...group,
          tag_count: countsByGroupId[group.group_id] || 0
        }));
        
        setGroupsData(groupsWithCounts);
      } else {
        console.log('No groups found for user, showing empty state');
        setGroupsData([]);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch groups';
      
      // If the table doesn't exist, show a more helpful message
      if (errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorMessage.includes('table')) {
        setGroupsError('Groups table not found. The keywordshub_tag_groups table may need to be created.');
      } else {
        setGroupsError(errorMessage);
      }
    } finally {
      setGroupsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userInternalId) {
      fetchData();
      fetchGroupsData();
    }
  }, [isOpen, userInternalId]);

  // Filter and sort tags data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => {
      // Text search filter
      if (searchTerm && !Object.values(item).some(value => 
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )) {
        return false;
      }

      // Group filter
      if (groupFilter !== 'all') {
        if (groupFilter === 'unassigned') {
          if (item.rel_tag_group !== null) return false;
        } else {
          if (item.rel_tag_group !== parseInt(groupFilter)) return false;
        }
      }

      // Is starred filter
      if (isStarredFilter !== 'all') {
        const isStarred = isStarredFilter === 'true';
        if (item.is_starred !== isStarred) return false;
      }

      return true;
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
  }, [data, searchTerm, sortField, sortOrder, groupFilter, isStarredFilter]);

  // Filter and sort groups data
  const filteredAndSortedGroupsData = useMemo(() => {
    let filtered = groupsData.filter(item => {
      if (!groupsSearchTerm) return true;
      return Object.values(item).some(value => 
        value?.toString().toLowerCase().includes(groupsSearchTerm.toLowerCase())
      );
    });

    // Sort data
    filtered.sort((a, b) => {
      const aValue = a[groupsSortField];
      const bValue = b[groupsSortField];
      
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return groupsSortOrder === 'asc' ? -1 : 1;
      if (bValue === null) return groupsSortOrder === 'asc' ? 1 : -1;
      
      if (aValue < bValue) return groupsSortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return groupsSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [groupsData, groupsSearchTerm, groupsSortField, groupsSortOrder]);

  // Tags pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  // Groups pagination
  const groupsTotalPages = Math.ceil(filteredAndSortedGroupsData.length / groupsItemsPerPage);
  const groupsStartIndex = (groupsCurrentPage - 1) * groupsItemsPerPage;
  const paginatedGroupsData = filteredAndSortedGroupsData.slice(groupsStartIndex, groupsStartIndex + groupsItemsPerPage);

  // Handle tags sort
  const handleSort = (field: keyof KeywordTag) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle groups sort
  const handleGroupsSort = (field: keyof KeywordTagGroup) => {
    if (groupsSortField === field) {
      setGroupsSortOrder(groupsSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setGroupsSortField(field);
      setGroupsSortOrder('asc');
    }
  };

  // Handle filter button click
  const handleFilter = (tag: KeywordTag) => {
    onSelectTag({ tag_id: tag.tag_id, tag_name: tag.tag_name });
  };

  // Handle group filter navigation
  const navigateGroupFilter = (direction: 'prev' | 'next') => {
    // Build the options array (same as in the dropdown)
    const options = [
      'all',
      'unassigned',
      ...groupsData.map(group => group.group_id.toString())
    ];
    
    const currentIndex = options.indexOf(groupFilter);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
    } else {
      newIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
    }
    
    setGroupFilter(options[newIndex]);
    setCurrentPage(1);
  };

  // Handle star toggle
  const toggleStar = async (tagId: number, currentValue: boolean | null) => {
    if (!userInternalId) return;
    
    const newValue = !currentValue;
    
    // Optimistically update the UI
    setData(prev => 
      prev.map(tag => 
        tag.tag_id === tagId ? { ...tag, is_starred: newValue } : tag
      )
    );

    try {
      const { error } = await supabase
        .from('keywordshub_tags')
        .update({ is_starred: newValue })
        .eq('tag_id', tagId)
        .eq('user_id', userInternalId);

      if (error) {
        console.error('Error updating tag star status:', error);
        // Revert on error
        setData(prev => 
          prev.map(tag => 
            tag.tag_id === tagId ? { ...tag, is_starred: currentValue } : tag
          )
        );
      }
    } catch (err) {
      console.error('Error toggling star:', err);
      // Revert on error
      setData(prev => 
        prev.map(tag => 
          tag.tag_id === tagId ? { ...tag, is_starred: currentValue } : tag
        )
      );
    }
  };

  // Handle row selection
  const handleRowSelect = (tagId: number) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(tagId)) {
      newSelectedRows.delete(tagId);
    } else {
      newSelectedRows.add(tagId);
    }
    setSelectedRows(newSelectedRows);
    
    // Update select all state
    setSelectAll(newSelectedRows.size === filteredAndSortedData.length && filteredAndSortedData.length > 0);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
      setSelectAll(false);
    } else {
      const allIds = filteredAndSortedData.map(item => item.tag_id);
      setSelectedRows(new Set(allIds));
      setSelectAll(true);
    }
  };

  // Handle groups row selection
  const handleGroupsRowSelect = (groupId: number) => {
    const newSelectedRows = new Set(groupsSelectedRows);
    if (newSelectedRows.has(groupId)) {
      newSelectedRows.delete(groupId);
    } else {
      newSelectedRows.add(groupId);
    }
    setGroupsSelectedRows(newSelectedRows);
    
    // Update select all state
    setGroupsSelectAll(newSelectedRows.size === filteredAndSortedGroupsData.length && filteredAndSortedGroupsData.length > 0);
  };

  // Handle groups select all
  const handleGroupsSelectAll = () => {
    if (groupsSelectAll) {
      setGroupsSelectedRows(new Set());
      setGroupsSelectAll(false);
    } else {
      const allIds = filteredAndSortedGroupsData.map(item => item.group_id);
      setGroupsSelectedRows(new Set(allIds));
      setGroupsSelectAll(true);
    }
  };

  // Handle save new group
  const handleSaveNewGroup = async () => {
    if (!newGroupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    if (!userInternalId) {
      alert('User not authenticated');
      return;
    }

    try {
      const newGroup = {
        group_name: newGroupName.trim(),
        group_description: newGroupDescription.trim() || null,
        display_order: 0,
        is_starred: false,
        // user_id: userInternalId, // Commented out until user_id column is added
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('keywordshub_tag_groups')
        .insert(newGroup)
        .select()
        .single();

      if (error) {
        console.error('Error creating group:', error);
        alert('Failed to create group: ' + error.message);
      } else {
        console.log('Group created successfully:', data);
        // Add the new group to the beginning of the list
        setGroupsData([{ ...data, tag_count: 0 }, ...groupsData]);
        setIsCreatingNewGroup(false);
        setNewGroupName('');
        setNewGroupDescription('');
      }
    } catch (err) {
      console.error('Error saving group:', err);
      alert('Failed to create group');
    }
  };

  // Handle cancel new group
  const handleCancelNewGroup = () => {
    setIsCreatingNewGroup(false);
    setNewGroupName('');
    setNewGroupDescription('');
  };

  // Handle start editing group name
  const handleStartEditGroup = (group: KeywordTagGroup) => {
    setEditingGroupId(group.group_id);
    setEditingGroupName(group.group_name);
  };

  // Handle save edited group name
  const handleSaveEditGroup = async () => {
    if (!editingGroupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    if (editingGroupId === null) return;

    try {
      const { data, error } = await supabase
        .from('keywordshub_tag_groups')
        .update({ 
          group_name: editingGroupName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('group_id', editingGroupId)
        .select()
        .single();

      if (error) {
        console.error('Error updating group:', error);
        alert('Failed to update group: ' + error.message);
      } else {
        console.log('Group updated successfully:', data);
        // Update the local state
        setGroupsData(prev => 
          prev.map(group => 
            group.group_id === editingGroupId 
              ? { ...group, group_name: editingGroupName.trim(), updated_at: data.updated_at }
              : group
          )
        );
        setEditingGroupId(null);
        setEditingGroupName('');
      }
    } catch (err) {
      console.error('Error saving group:', err);
      alert('Failed to update group');
    }
  };

  // Handle cancel editing group name
  const handleCancelEditGroup = () => {
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  // Handle add selected tags to group
  const handleAddSelectedTagsToGroup = async (group: KeywordTagGroup) => {
    if (selectedRows.size === 0) {
      return;
    }

    const selectedTagIds = Array.from(selectedRows);

    try {
      // Update the rel_tag_group field for selected tags
      const { error } = await supabase
        .from('keywordshub_tags')
        .update({ 
          rel_tag_group: group.group_id,
          updated_at: new Date().toISOString()
        })
        .in('tag_id', selectedTagIds);

      if (error) {
        console.error('Error adding tags to group:', error);
      } else {
        console.log('Tags added to group successfully');
        
        // Show success message
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 1750); // Total animation time: 500ms fade in + 500ms solid + 750ms fade out
        
        // Refresh the groups data to update tag counts
        fetchGroupsData();
        
        // Clear selected tags
        setSelectedRows(new Set());
        setSelectAll(false);
      }
    } catch (err) {
      console.error('Error adding tags to group:', err);
    }
  };

  // Handle generate cached quantities for selected tags
  const handleGenerateCachedQty = async () => {
    if (selectedRows.size === 0) {
      alert('No tags are selected. Please select some tags first.');
      return;
    }

    const selectedTagIds = Array.from(selectedRows);
    const confirmGenerate = window.confirm(
      `Generate cached quantities for ${selectedTagIds.length} selected tag(s)?\n\nThis will count keywords for each tag and update qty_starred and qty_chosen columns.`
    );
    
    if (!confirmGenerate) return;

    try {
      // Process each selected tag
      for (const tagId of selectedTagIds) {
        console.log(`Processing tag ID: ${tagId}`);
        
        // Count starred and chosen keywords
        let qtyStarred = 0;
        let qtyChosen = 0;
        
        // Get all keywords belonging to this tag through the relation table
        const { data: tagRelations, error: relationError } = await supabase
          .from('keywordshub_tag_relations')
          .select('fk_keyword_id')
          .eq('fk_tag_id', tagId);

        if (relationError) {
          console.error(`Error fetching tag relations for tag ${tagId}:`, relationError);
          alert(`Error fetching tag relations for tag ${tagId}: ${relationError.message}`);
          continue;
        }

        if (!tagRelations || tagRelations.length === 0) {
          console.log(`No keywords found for tag ${tagId}`);
          // qtyStarred and qtyChosen remain 0
        } else {
          // Get the keyword IDs
          const keywordIds = tagRelations.map(rel => rel.fk_keyword_id);
          
          // Get all keywords with these IDs
          const { data: keywords, error: keywordError } = await supabase
            .from('keywordshub')
            .select('is_starred, is_chosen')
            .in('keyword_id', keywordIds);

          if (keywordError) {
            console.error(`Error fetching keywords for tag ${tagId}:`, keywordError);
            alert(`Error fetching keywords for tag ${tagId}: ${keywordError.message}`);
            continue;
          }

          if (keywords && keywords.length > 0) {
            keywords.forEach(keyword => {
              if (keyword.is_starred === true) qtyStarred++;
              if (keyword.is_chosen === true) qtyChosen++;
            });
          }
        }

        const totalKeywords = tagRelations ? tagRelations.length : 0;
        console.log(`Tag ${tagId}: ${qtyStarred} starred, ${qtyChosen} chosen out of ${totalKeywords} total keywords`);

        // Update the tag with the calculated quantities
        const { error: updateError } = await supabase
          .from('keywordshub_tags')
          .update({
            qty_starred: qtyStarred,
            qty_chosen: qtyChosen,
            updated_at: new Date().toISOString()
          })
          .eq('tag_id', tagId);

        if (updateError) {
          console.error(`Error updating tag ${tagId}:`, updateError);
          alert(`Error updating tag ${tagId}: ${updateError.message}`);
          continue;
        }

        // Update local state
        setData(prev => 
          prev.map(tag => 
            tag.tag_id === tagId 
              ? { ...tag, qty_starred: qtyStarred, qty_chosen: qtyChosen, updated_at: new Date().toISOString() }
              : tag
          )
        );
      }

      alert(`Successfully generated cached quantities for ${selectedTagIds.length} tag(s)`);
      console.log('Cached quantity generation completed');

    } catch (err) {
      console.error('Error generating cached quantities:', err);
      alert('Failed to generate cached quantities');
    }
  };

  // Handle delete group
  const handleDeleteGroup = async (group: KeywordTagGroup) => {
    // Confirm deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the group "${group.group_name}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('keywordshub_tag_groups')
        .delete()
        .eq('group_id', group.group_id);

      if (error) {
        console.error('Error deleting group:', error);
        alert('Failed to delete group: ' + error.message);
      } else {
        console.log('Group deleted successfully:', group.group_id);
        // Remove the group from local state
        setGroupsData(prev => prev.filter(g => g.group_id !== group.group_id));
        // Remove from selected rows if it was selected
        setGroupsSelectedRows(prev => {
          const newSet = new Set(prev);
          newSet.delete(group.group_id);
          return newSet;
        });
        // Cancel editing if this group was being edited
        if (editingGroupId === group.group_id) {
          handleCancelEditGroup();
        }
      }
    } catch (err) {
      console.error('Error deleting group:', err);
      alert('Failed to delete group');
    }
  };

  // Handle scan keywords for shared tags
  const handleScanKeywords = async () => {
    if (!selectedTagForDelete || !userInternalId) return;
    
    setIsScanning(true);
    try {
      // Get all keywords for this tag
      const { data: tagRelations, error: relationError } = await supabase
        .from('keywordshub_tag_relations')
        .select('fk_keyword_id')
        .eq('fk_tag_id', selectedTagForDelete.tag_id);

      if (relationError) {
        console.error('Error fetching tag relations:', relationError);
        setIsScanning(false);
        return;
      }

      const totalKeywords = tagRelations?.length || 0;
      
      if (totalKeywords === 0) {
        setScanResults({ total: 0, shared: 0 });
        setIsScanning(false);
        return;
      }

      const keywordIds = tagRelations.map(rel => rel.fk_keyword_id);
      
      // Check which keywords are shared with other tags
      const { data: sharedRelations, error: sharedError } = await supabase
        .from('keywordshub_tag_relations')
        .select('fk_keyword_id, fk_tag_id')
        .in('fk_keyword_id', keywordIds)
        .neq('fk_tag_id', selectedTagForDelete.tag_id);

      if (sharedError) {
        console.error('Error checking shared keywords:', sharedError);
        setIsScanning(false);
        return;
      }

      // Count unique keywords that are shared
      const uniqueSharedKeywords = new Set(sharedRelations?.map(rel => rel.fk_keyword_id) || []);
      
      setScanResults({
        total: totalKeywords,
        shared: uniqueSharedKeywords.size
      });
    } catch (err) {
      console.error('Error scanning keywords:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Handle special delete operations
  const handleSpecialDelete = async (deleteType: 'tag-only' | 'tag-and-all' | 'tag-and-exclusive') => {
    if (!selectedTagForDelete || !userInternalId) return;

    try {
      if (deleteType === 'tag-only') {
        // First delete all tag relations
        const { error: relationsError } = await supabase
          .from('keywordshub_tag_relations')
          .delete()
          .eq('fk_tag_id', selectedTagForDelete.tag_id);

        if (relationsError) {
          console.error('Error deleting tag relations:', relationsError);
        }

        // Then delete the tag
        const { error } = await supabase
          .from('keywordshub_tags')
          .delete()
          .eq('tag_id', selectedTagForDelete.tag_id)
          .eq('user_id', userInternalId);

        if (error) {
          console.error('Error deleting tag:', error);
        } else {
          // Show success and refresh
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 1750);
          fetchData();
          setSelectedRows(new Set());
          setSelectAll(false);
        }
      } else if (deleteType === 'tag-and-all') {
        // First get all keyword IDs for this tag
        const { data: tagRelations } = await supabase
          .from('keywordshub_tag_relations')
          .select('fk_keyword_id')
          .eq('fk_tag_id', selectedTagForDelete.tag_id);

        const keywordIds = tagRelations?.map(rel => rel.fk_keyword_id) || [];

        // Delete tag relations first (to avoid foreign key constraint)
        const { error: relationsError } = await supabase
          .from('keywordshub_tag_relations')
          .delete()
          .eq('fk_tag_id', selectedTagForDelete.tag_id);

        if (relationsError) {
          console.error('Error deleting tag relations:', relationsError);
        }

        // Delete keywords by first clearing all foreign key references
        if (keywordIds.length > 0) {
          console.log(`Starting deletion process for ${keywordIds.length} keywords`);
          
          const batchSize = 25; // Smaller batches to reduce URL length and potential conflicts
          for (let i = 0; i < keywordIds.length; i += batchSize) {
            const batch = keywordIds.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i/batchSize) + 1}: keywords ${batch[0]} to ${batch[batch.length-1]}`);
            
            // Step 1: Delete keyword-tag relations
            const { error: kwRelationsError } = await supabase
              .from('keywordshub_tag_relations')
              .delete()
              .in('fk_keyword_id', batch);

            if (kwRelationsError) {
              console.error('Error deleting keyword relations:', kwRelationsError);
            }

            // Step 2: Clear all references in cncglub table
            for (const kwId of batch) {
              for (let j = 1; j <= 10; j++) {
                const columnName = `kwslot${j}`;
                const { error: cncglubError } = await supabase
                  .from('cncglub')
                  .update({ [columnName]: null })
                  .eq(columnName, kwId);
                
                if (cncglubError && cncglubError.code !== 'PGRST116') {
                  console.error(`Error clearing cncglub ${columnName} for keyword ${kwId}:`, cncglubError);
                }
              }
            }

            // Step 3: Delete from zhe_serp_fetches (with smaller sub-batches)
            const serpBatchSize = 10;
            for (let k = 0; k < batch.length; k += serpBatchSize) {
              const serpBatch = batch.slice(k, k + serpBatchSize);
              const { error: serpError } = await supabase
                .from('zhe_serp_fetches')
                .delete()
                .in('rel_keyword_id', serpBatch);

              if (serpError && serpError.code !== 'PGRST116') {
                console.error('Error deleting serp fetches:', serpError);
              }
            }

            // Step 4: Delete from keywordshub_serp_zone_cache
            const { error: cacheError } = await supabase
              .from('keywordshub_serp_zone_cache')
              .delete()
              .in('keyword_id', batch);

            if (cacheError && cacheError.code !== 'PGRST116') {
              console.error('Error deleting serp cache:', cacheError);
            }

            // Step 5: Delete from keywordshub_tracking if it exists
            const { error: trackingError } = await supabase
              .from('keywordshub_tracking')
              .delete()
              .in('keyword_id', batch);

            if (trackingError && trackingError.code !== 'PGRST116') {
              console.error('Error deleting tracking records:', trackingError);
            }

            // Step 6: Finally delete the keywords themselves
            const { error: keywordError } = await supabase
              .from('keywordshub')
              .delete()
              .in('keyword_id', batch);

            if (keywordError) {
              console.error('Error deleting keywords batch:', keywordError);
              console.error('Failed batch:', batch);
            } else {
              console.log(`Successfully deleted keyword batch: ${batch.join(', ')}`);
            }

            // Add delay between batches to prevent overwhelming the database
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        // Finally delete the tag
        const { error: tagError } = await supabase
          .from('keywordshub_tags')
          .delete()
          .eq('tag_id', selectedTagForDelete.tag_id)
          .eq('user_id', userInternalId);

        if (!tagError) {
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 1750);
          fetchData();
          setSelectedRows(new Set());
          setSelectAll(false);
        }
      } else if (deleteType === 'tag-and-exclusive') {
        // Get all keywords for this tag
        const { data: tagRelations } = await supabase
          .from('keywordshub_tag_relations')
          .select('fk_keyword_id')
          .eq('fk_tag_id', selectedTagForDelete.tag_id);

        const keywordIds = tagRelations?.map(rel => rel.fk_keyword_id) || [];

        if (keywordIds.length > 0) {
          // Find keywords that are NOT shared with other tags
          const { data: sharedRelations } = await supabase
            .from('keywordshub_tag_relations')
            .select('fk_keyword_id')
            .in('fk_keyword_id', keywordIds)
            .neq('fk_tag_id', selectedTagForDelete.tag_id);

          const sharedKeywordIds = new Set(sharedRelations?.map(rel => rel.fk_keyword_id) || []);
          const exclusiveKeywordIds = keywordIds.filter(id => !sharedKeywordIds.has(id));

          // First delete relations for this tag
          const { error: relationsError } = await supabase
            .from('keywordshub_tag_relations')
            .delete()
            .eq('fk_tag_id', selectedTagForDelete.tag_id);

          if (relationsError) {
            console.error('Error deleting tag relations:', relationsError);
          }

          // Delete exclusive keywords in batches
          if (exclusiveKeywordIds.length > 0) {
            const batchSize = 50;
            for (let i = 0; i < exclusiveKeywordIds.length; i += batchSize) {
              const batch = exclusiveKeywordIds.slice(i, i + batchSize);
              
              // Delete all relations for these exclusive keywords
              const { error: kwRelationsError } = await supabase
                .from('keywordshub_tag_relations')
                .delete()
                .in('fk_keyword_id', batch);

              if (kwRelationsError) {
                console.error('Error deleting exclusive keyword relations:', kwRelationsError);
              }

              // Then delete the keywords
              const { error: keywordError } = await supabase
                .from('keywordshub')
                .delete()
                .in('keyword_id', batch);

              if (keywordError) {
                console.error('Error deleting exclusive keywords batch:', keywordError);
              }
            }
          }
        } else {
          // Just delete the tag relations if no keywords
          const { error: relationsError } = await supabase
            .from('keywordshub_tag_relations')
            .delete()
            .eq('fk_tag_id', selectedTagForDelete.tag_id);

          if (relationsError) {
            console.error('Error deleting tag relations:', relationsError);
          }
        }

        // Finally delete the tag
        const { error: tagError } = await supabase
          .from('keywordshub_tags')
          .delete()
          .eq('tag_id', selectedTagForDelete.tag_id)
          .eq('user_id', userInternalId);

        if (!tagError) {
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 1750);
          fetchData();
          setSelectedRows(new Set());
          setSelectAll(false);
        }
      }

      setShowDeletePopup(false);
      setSelectedTagForDelete(null);
      setScanResults(null);
    } catch (err) {
      console.error('Error in special delete operation:', err);
    }
  };

  // Render tags cell content
  const renderCell = (item: KeywordTag, column: typeof tagsColumns[0]) => {
    // Wrapper function to conditionally wrap content with cell_inner_wrapper_div
    const wrapContent = (content: React.ReactNode) => {
      if (column.shrinkColumn) {
        return <div className="cell_inner_wrapper_div">{content}</div>;
      }
      return content;
    };

    if (column.key === 'checkbox') {
      return wrapContent(
        <div className="px-2 py-1 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selectedRows.has(item.tag_id)}
            onChange={() => handleRowSelect(item.tag_id)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      );
    }
    
    if (column.key === 'filter') {
      return wrapContent(
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleFilter(item);
          }}
          className="bg-black text-white px-3 py-1 rounded text-xs font-medium hover:bg-gray-800 transition-colors"
        >
          filter
        </button>
      );
    }

    // Special handling for star column (same as KeywordsHubTable)
    if (column.key === 'is_starred') {
      const value = item.is_starred;
      return wrapContent(
        <div className="px-2 py-1 flex items-center justify-center">
          <div
            onClick={(e) => {
              e.stopPropagation();
              toggleStar(item.tag_id, value);
            }}
            style={{ cursor: 'pointer', padding: '4px' }}
            title={value ? "Click to unstar" : "Click to star"}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              style={{ color: value ? '#dc2626' : '#9ca3af' }}
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={value ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          </div>
        </div>
      );
    }

    const value = item[column.key as keyof KeywordTag];
    
    if (column.type === 'datetime' && value) {
      return wrapContent(
        <div className="px-2 py-1 text-xs">
          {new Date(value as string).toLocaleString()}
        </div>
      );
    }

    if (column.type === 'number' && value !== null) {
      return wrapContent(
        <div className="px-2 py-1 text-xs">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      );
    }

    return wrapContent(
      <div className="px-2 py-1 text-xs">
        {value?.toString() || ''}
      </div>
    );
  };

  // Render groups cell content
  const renderGroupsCell = (item: KeywordTagGroup, column: typeof groupsColumns[0]) => {
    if (column.key === 'checkbox') {
      return (
        <div className="px-2 py-1 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={groupsSelectedRows.has(item.group_id)}
            onChange={() => handleGroupsRowSelect(item.group_id)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      );
    }
    
    if (column.key === 'group_name') {
      if (editingGroupId === item.group_id) {
        return (
          <div className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editingGroupName}
              onChange={(e) => setEditingGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEditGroup();
                if (e.key === 'Escape') handleCancelEditGroup();
              }}
              onBlur={handleSaveEditGroup}
              className="w-full px-1 py-0 text-xs border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
              autoFocus
            />
          </div>
        );
      } else {
        return (
          <div 
            className="px-2 py-1 text-xs cursor-text hover:bg-gray-100 rounded"
            onClick={(e) => {
              e.stopPropagation();
              handleStartEditGroup(item);
            }}
            title="Click to edit group name"
          >
            {item.group_name}
          </div>
        );
      }
    }
    
    if (column.key === 'edit') {
      return (
        <div className="flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement edit functionality
              console.log('Edit group:', item.group_id);
            }}
            className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddSelectedTagsToGroup(item);
            }}
            className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-purple-700 transition-colors whitespace-nowrap"
            title={`Add selected tags to "${item.group_name}"`}
          >
            add sel. tags
          </button>
        </div>
      );
    }

    if (column.key === 'delete') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteGroup(item);
          }}
          className="bg-red-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-700 transition-colors"
          title={`Delete group "${item.group_name}"`}
        >
          delete
        </button>
      );
    }

    // Handle star toggle for groups
    if (column.key === 'is_starred') {
      const value = item.is_starred;
      return (
        <div className="px-2 py-1 flex items-center justify-center">
          <div
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement group star toggle
              console.log('Toggle star for group:', item.group_id);
            }}
            style={{ cursor: 'pointer', padding: '4px' }}
            title={value ? "Click to unstar" : "Click to star"}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              style={{ color: value ? '#dc2626' : '#9ca3af' }}
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={value ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          </div>
        </div>
      );
    }

    const value = item[column.key as keyof KeywordTagGroup];
    
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
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ padding: '20px' }}>
      {/* Inject shrinkage styles */}
      <style dangerouslySetInnerHTML={{ __html: shrinkageStyles }} />
      
      {/* Success Message Overlay */}
      {showSuccessMessage && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none"
          style={{
            animation: 'successFadeInOut 1.75s ease-in-out'
          }}
        >
          <div className="flex items-center space-x-2" style={{ fontSize: '14px', color: '#16a34a' }}>
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 20 20" 
              fill="currentColor"
              style={{ color: '#16a34a' }}
            >
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
            <span style={{ fontWeight: 500 }}>Success!</span>
          </div>
        </div>
      )}
      
      {/* Special Delete Popup */}
      {showDeletePopup && selectedTagForDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-[110] bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Special Tag Delete Process</h2>
            
            {/* Tag Details */}
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">Tag Details:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">Tag Name:</span> {selectedTagForDelete.tag_name}</div>
                <div><span className="font-medium">Tag ID:</span> {selectedTagForDelete.tag_id}</div>
                <div><span className="font-medium">Tag Order:</span> {selectedTagForDelete.tag_order}</div>
                <div><span className="font-medium">Group:</span> {selectedTagForDelete.group_name || 'Unassigned'}</div>
                <div><span className="font-medium">Keywords:</span> {selectedTagForDelete.keyword_count || 0}</div>
                <div><span className="font-medium">Starred:</span> {selectedTagForDelete.is_starred ? 'Yes' : 'No'}</div>
                <div><span className="font-medium">Qty Starred:</span> {selectedTagForDelete.qty_starred || 0}</div>
                <div><span className="font-medium">Qty Chosen:</span> {selectedTagForDelete.qty_chosen || 0}</div>
                <div className="col-span-2">
                  <span className="font-medium">Created:</span> {new Date(selectedTagForDelete.created_at).toLocaleString()}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Updated:</span> {new Date(selectedTagForDelete.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
            
            {/* Scan Section */}
            <div className="mb-6 p-4 border-2 border-blue-300 rounded bg-blue-50">
              <button
                onClick={handleScanKeywords}
                disabled={isScanning}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {isScanning ? 'Scanning...' : 'scan all keywords in this tag to see if they are part of another tag also'}
              </button>
              
              {scanResults && (
                <div className="mt-3 text-sm">
                  <div>total keywords in tag: <span className="font-bold">{scanResults.total}</span></div>
                  <div>total keywords that are part of another tag also: <span className="font-bold">{scanResults.shared}</span></div>
                </div>
              )}
            </div>
            
            {/* Delete Options */}
            <div className="space-y-3">
              <h3 className="font-semibold mb-2">Delete Options:</h3>
              
              <button
                onClick={() => handleSpecialDelete('tag-only')}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded text-sm font-medium transition-colors text-left"
              >
                <div className="font-semibold">Delete tag only</div>
                <div className="text-xs opacity-90 mt-1">Removes the tag but keeps all keywords</div>
              </button>
              
              <button
                onClick={() => handleSpecialDelete('tag-and-all')}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded text-sm font-medium transition-colors text-left"
              >
                <div className="font-semibold">Delete tag and all keywords</div>
                <div className="text-xs opacity-90 mt-1">Removes the tag and ALL associated keywords</div>
              </button>
              
              <button
                onClick={() => handleSpecialDelete('tag-and-exclusive')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded text-sm font-medium transition-colors text-left"
              >
                <div className="font-semibold">Delete tag and delete only the keywords that are not shared by other tags</div>
                <div className="text-xs opacity-90 mt-1">Removes the tag and only keywords exclusive to this tag</div>
              </button>
            </div>
            
            {/* Cancel Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowDeletePopup(false);
                  setSelectedTagForDelete(null);
                  setScanResults(null);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes successFadeInOut {
          0% { opacity: 0; }
          28.5% { opacity: 1; } /* 500ms / 1750ms = 28.5% */
          57% { opacity: 1; } /* (500ms + 500ms) / 1750ms = 57% */
          100% { opacity: 0; }
        }
      `}</style>
      <div className="bg-white rounded-lg shadow-xl w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-md border border-yellow-400 relative">
                <div className="absolute top-1 left-1 w-2 h-2 bg-yellow-100 rounded-full opacity-60"></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-yellow-600 rounded-full"></div>
              </div>
              <span>Tags Plench</span>
            </h2>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('tags')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                    activeTab === 'tags'
                      ? 'text-blue-600 border-blue-600 bg-blue-50'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  tags
                </button>
                <button
                  onClick={() => setActiveTab('groups')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                    activeTab === 'groups'
                      ? 'text-blue-600 border-blue-600 bg-blue-50'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  groups
                </button>
              </div>
              <div className="flex space-x-3">
                <div className="px-3 py-1 bg-gray-100 rounded text-sm text-gray-700 font-medium">
                  Tags Selected: {selectedRows.size}
                </div>
                <div className="px-3 py-1 bg-gray-100 rounded text-sm text-gray-700 font-medium">
                  Groups Selected: {groupsSelectedRows.size}
                </div>
              </div>
            </div>
          </div>
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
            <button
              onClick={() => {
                if (activeTab === 'tags') {
                  fetchData();
                } else {
                  fetchGroupsData();
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              refresh load
            </button>
            {activeTab === 'groups' && (
              <button
                onClick={() => {
                  setIsCreatingNewGroup(true);
                  setNewGroupName('');
                  setNewGroupDescription('');
                  setGroupsCurrentPage(1);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                create new group (inline)
              </button>
            )}
            <div className="relative">
              <input
                type="text"
                placeholder={activeTab === 'tags' ? "Search tags..." : "Search groups..."}
                value={activeTab === 'tags' ? searchTerm : groupsSearchTerm}
                onChange={(e) => {
                  if (activeTab === 'tags') {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  } else {
                    setGroupsSearchTerm(e.target.value);
                    setGroupsCurrentPage(1);
                  }
                }}
                className="w-60 px-3 py-2 pr-12 border border-gray-300 rounded-md text-sm"
              />
              <button
                onClick={() => {
                  if (activeTab === 'tags') {
                    setSearchTerm('');
                    setCurrentPage(1);
                  } else {
                    setGroupsSearchTerm('');
                    setGroupsCurrentPage(1);
                  }
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-yellow-400 hover:bg-yellow-500 text-black px-2 py-1 rounded text-xs font-medium"
              >
                CL
              </button>
            </div>
            {activeTab === 'tags' && (
              <>
                <button
                  onClick={() => handleGenerateCachedQty()}
                  disabled={selectedRows.size === 0}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    selectedRows.size === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
                  title={selectedRows.size === 0 ? 'Select tags to generate quantities' : `Generate cached quantities for ${selectedRows.size} selected tag(s)`}
                >
                  generate cached qty (star, etc.)
                </button>
                <button
                  onClick={() => {
                    if (selectedRows.size === 1) {
                      const tagId = Array.from(selectedRows)[0];
                      const tag = data.find(t => t.tag_id === tagId);
                      if (tag) {
                        setSelectedTagForDelete(tag);
                        setShowDeletePopup(true);
                        setScanResults(null);
                      }
                    }
                  }}
                  disabled={selectedRows.size !== 1}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    selectedRows.size !== 1
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  title={selectedRows.size !== 1 ? 'Select exactly one tag for special delete' : 'Special tag delete process'}
                >
                  special tag delete process f5102
                </button>
              </>
            )}
            {activeTab === 'tags' && selectedTag && (
              <div className="text-sm text-purple-600 font-medium">
                Current filter: {selectedTag.tag_name}
              </div>
            )}
            {activeTab === 'tags' && (
              <table style={{ borderCollapse: 'collapse', border: '1px solid gray' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid gray', padding: '0' }}>
                      <div className="cell_inner_wrapper_div" style={{ padding: '4px' }}>
                        <label className="text-sm font-medium text-gray-700">group:</label>
                      </div>
                    </th>
                    <th style={{ border: '1px solid gray', padding: '0' }}>
                      <div className="cell_inner_wrapper_div" style={{ padding: '4px' }}>
                        <label className="text-sm font-medium text-gray-700">is_starred:</label>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid gray', padding: '0' }}>
                      <div className="cell_inner_wrapper_div" style={{ padding: '4px' }}>
                        <select
                          value={groupFilter}
                          onChange={(e) => {
                            setGroupFilter(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="all">all</option>
                          <option value="unassigned">unassigned</option>
                          {groupsData.map(group => (
                            <option key={group.group_id} value={group.group_id.toString()}>
                              {group.group_name}
                            </option>
                          ))}
                        </select>
                        <div className="inline-flex ml-2">
                          <button
                            onClick={() => navigateGroupFilter('prev')}
                            className="w-6 h-6 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-l-sm flex items-center justify-center text-xs"
                            title="Previous group"
                          >
                            ↶
                          </button>
                          <button
                            onClick={() => navigateGroupFilter('next')}
                            className="w-6 h-6 bg-gray-200 hover:bg-gray-300 border border-gray-400 border-l-0 rounded-r-sm flex items-center justify-center text-xs"
                            title="Next group"
                          >
                            ↷
                          </button>
                        </div>
                      </div>
                    </td>
                    <td style={{ border: '1px solid gray', padding: '0' }}>
                      <div className="cell_inner_wrapper_div" style={{ padding: '4px' }}>
                        <select
                          value={isStarredFilter}
                          onChange={(e) => {
                            setIsStarredFilter(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="all">all</option>
                          <option value="true">starred</option>
                          <option value="false">not starred</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            {activeTab === 'tags' ? (
              // Tags Table
              loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-500">Loading tags...</div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-red-500">Error: {error}</div>
                </div>
              ) : (
                <table className="tags-plench-table border-collapse border border-gray-200" style={{ width: 'auto' }}>
                  <thead className="sticky top-0">
                    {/* Table name header */}
                    <tr>
                      {tagsColumns.map((column) => (
                        <th
                          key={`header-${column.key}`}
                          className={`px-2 py-3 text-left border border-gray-200 bg-[#bcc4f1] ${column.shrinkColumn ? `for_db_column_${column.key}` : ''}`}
                        >
                          <div className="cell_inner_wrapper_div">
                            <span className="font-bold text-xs">
                              {column.key === 'checkbox' ? '-' : (column.headerRow1Text || 'keywordshub_tags')}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                    {/* Column headers */}
                    <tr>
                      {tagsColumns.map((column) => (
                        <th
                          key={column.key}
                          className={`px-2 py-3 text-left border border-gray-200 ${
                            column.key === 'filter' || column.key === 'is_starred' || column.key === 'checkbox' ? '' : 'cursor-pointer hover:bg-gray-100'
                          } ${column.shrinkColumn ? `for_db_column_${column.key}` : ''}`}
                          onClick={() => column.key !== 'filter' && column.key !== 'is_starred' && column.key !== 'checkbox' && handleSort(column.key as keyof KeywordTag)}
                        >
                          <div className="cell_inner_wrapper_div">
                            {column.key === 'checkbox' ? (
                              <div className="flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={selectAll}
                                  onChange={handleSelectAll}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <span className="font-bold text-xs lowercase">
                                  {column.headerRow2Text || column.label}
                                </span>
                                {column.key !== 'filter' && column.key !== 'is_starred' && sortField === column.key && (
                                  <span className="text-xs">
                                    {sortOrder === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {paginatedData.map((item) => (
                      <tr 
                        key={item.tag_id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleRowSelect(item.tag_id)}
                      >
                        {tagsColumns.map((column) => (
                          <td 
                            key={column.key} 
                            className={`border border-gray-200 ${column.shrinkColumn ? `for_db_column_${column.key}` : ''}`}
                            >
                            {renderCell(item, column)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              // Groups Table
              groupsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-500">Loading groups...</div>
                </div>
              ) : groupsError && !isCreatingNewGroup ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center max-w-md">
                    <div className="text-red-500 text-sm mb-2">Error: {groupsError}</div>
                    <div className="text-gray-600 text-xs">
                      {groupsError?.includes('user_id') ? 
                        'The keywordshub_tag_groups table exists but is missing the user_id column. Please run: ALTER TABLE keywordshub_tag_groups ADD COLUMN user_id TEXT;' :
                        'To use groups functionality, please ensure the keywordshub_tag_groups table is properly configured.'
                      }
                    </div>
                  </div>
                </div>
              ) : (isCreatingNewGroup || paginatedGroupsData.length > 0) ? (
                <table className="w-full border-collapse border border-gray-200">
                  <thead className="sticky top-0">
                    {/* Table name header */}
                    <tr>
                      {groupsColumns.map((column) => (
                        <th
                          key={`header-${column.key}`}
                          className="px-2 py-3 text-left border border-gray-200 bg-[#c9f2d4]"
                        >
                          <span className="font-bold text-xs">
                            {column.key === 'checkbox' ? '-' : (column.headerRow1Text || 'groups')}
                          </span>
                        </th>
                      ))}
                    </tr>
                    {/* Column headers */}
                    <tr>
                      {groupsColumns.map((column) => (
                        <th
                          key={column.key}
                          className={`px-2 py-3 text-left border border-gray-200 ${
                            column.key === 'edit' || column.key === 'delete' || column.key === 'is_starred' || column.key === 'checkbox' ? '' : 'cursor-pointer hover:bg-gray-100'
                          }`}
                          onClick={() => column.key !== 'edit' && column.key !== 'delete' && column.key !== 'is_starred' && column.key !== 'checkbox' && handleGroupsSort(column.key as keyof KeywordTagGroup)}
                        >
                          {column.key === 'checkbox' ? (
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={groupsSelectAll}
                                onChange={handleGroupsSelectAll}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <span className="font-bold text-xs lowercase">
                                {column.headerRow2Text || column.label}
                              </span>
                              {column.key !== 'edit' && column.key !== 'delete' && column.key !== 'is_starred' && groupsSortField === column.key && (
                                <span className="text-xs">
                                  {groupsSortOrder === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {isCreatingNewGroup && (
                      <tr className="bg-green-50">
                        {groupsColumns.map((column) => (
                          <td 
                            key={column.key} 
                            className="border border-gray-200 px-2 py-1"
                            >
                            {column.key === 'checkbox' ? (
                              <div className="flex items-center justify-center">
                                <input type="checkbox" disabled className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                              </div>
                            ) : column.key === 'group_name' ? (
                              <input
                                type="text"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveNewGroup();
                                  if (e.key === 'Escape') handleCancelNewGroup();
                                }}
                                placeholder="Enter group name..."
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                autoFocus
                              />
                            ) : column.key === 'group_description' ? (
                              <input
                                type="text"
                                value={newGroupDescription}
                                onChange={(e) => setNewGroupDescription(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveNewGroup();
                                  if (e.key === 'Escape') handleCancelNewGroup();
                                }}
                                placeholder="Enter description..."
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            ) : column.key === 'edit' ? (
                              <div className="flex space-x-1">
                                <button
                                  onClick={handleSaveNewGroup}
                                  className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors"
                                >
                                  save
                                </button>
                                <button
                                  disabled
                                  className="bg-gray-400 text-white px-2 py-1 rounded text-xs font-medium cursor-not-allowed whitespace-nowrap"
                                  title="Save group first to add tags"
                                >
                                  add sel. tags
                                </button>
                              </div>
                            ) : column.key === 'delete' ? (
                              <button
                                onClick={handleCancelNewGroup}
                                className="bg-gray-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-gray-700 transition-colors"
                              >
                                cancel
                              </button>
                            ) : column.key === 'tag_count' ? (
                              <div className="px-2 py-1 text-xs">0</div>
                            ) : column.key === 'created_at' || column.key === 'updated_at' ? (
                              <div className="px-2 py-1 text-xs">now</div>
                            ) : (
                              <div className="px-2 py-1 text-xs">-</div>
                            )}
                          </td>
                        ))}
                      </tr>
                    )}
                    {paginatedGroupsData.map((item) => (
                      <tr 
                        key={item.group_id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleGroupsRowSelect(item.group_id)}
                      >
                        {groupsColumns.map((column) => (
                          <td 
                            key={column.key} 
                            className="border border-gray-200"
                            >
                            {renderGroupsCell(item, column)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-500 text-center">
                    <div className="text-lg mb-2">No groups found</div>
                    <div className="text-sm">Click "create new group (inline)" to add your first group</div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Footer with pagination info */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            {activeTab === 'tags' ? (
              <>
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
              </>
            ) : (
              <>
                <div>
                  Showing {groupsStartIndex + 1}-{Math.min(groupsStartIndex + groupsItemsPerPage, filteredAndSortedGroupsData.length)} of {filteredAndSortedGroupsData.length} groups
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setGroupsCurrentPage(Math.max(1, groupsCurrentPage - 1))}
                    disabled={groupsCurrentPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span>
                    Page {groupsCurrentPage} of {groupsTotalPages}
                  </span>
                  <button
                    onClick={() => setGroupsCurrentPage(Math.min(groupsTotalPages, groupsCurrentPage + 1))}
                    disabled={groupsCurrentPage === groupsTotalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}