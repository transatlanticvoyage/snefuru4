'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

interface FileRelease {
  release_id: number;
  release_date: string | null;
  zip_based_count?: number;
  transformed_count?: number;
  children_count?: number;
}

interface Props {
  onReleaseSelect: (releaseId: number | null) => void;
  selectXType: 'release' | 'subsheet' | 'subpart' | null;
  selectXId: number | null;
  onSelectX: (type: 'release' | 'subsheet' | 'subpart', id: number) => void;
}

export default function TileFileReleasesView({ onReleaseSelect, selectXType, selectXId, onSelectX }: Props) {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [releases, setReleases] = useState<FileRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null);

  const fetchReleases = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leadsmart_file_releases')
        .select('*')
        .order('release_id', { ascending: false });
      
      if (error) throw error;
      
      // Fetch counts for each release from both tables
      const releasesWithCounts = await Promise.all((data || []).map(async (release) => {
        // Count from leadsmart_zip_based_data
        const { count: zipBasedCount } = await supabase
          .from('leadsmart_zip_based_data')
          .select('*', { count: 'exact', head: true })
          .eq('rel_release_id', release.release_id);
        
        // Count from leadsmart_transformed
        const { count: transformedCount } = await supabase
          .from('leadsmart_transformed')
          .select('*', { count: 'exact', head: true })
          .eq('jrel_release_id', release.release_id);
        
        // Count children (subsheets)
        const { count: childrenCount } = await supabase
          .from('leadsmart_subsheets')
          .select('*', { count: 'exact', head: true })
          .eq('rel_release_id', release.release_id);
        
        return {
          ...release,
          zip_based_count: zipBasedCount || 0,
          transformed_count: transformedCount || 0,
          children_count: childrenCount || 0
        };
      }));
      
      setReleases(releasesWithCounts);
    } catch (error) {
      console.error('Error fetching releases:', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  const handleViewChildren = (releaseId: number) => {
    if (selectedReleaseId === releaseId) {
      setSelectedReleaseId(null);
      onReleaseSelect(null);
    } else {
      setSelectedReleaseId(releaseId);
      onReleaseSelect(releaseId);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="font-bold text-gray-700 mb-3">leadsmart_file_releases</div>
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="font-bold text-gray-700 mb-3">leadsmart_file_releases</div>
      
      {/* Tile Grid - wraps left to right */}
      <div className="flex flex-wrap gap-2">
        {releases.map((release) => {
          const isSelectX = selectXType === 'release' && selectXId === release.release_id;
          const isViewChildren = selectedReleaseId === release.release_id;
          
          return (
            <table 
              key={release.release_id}
              className="border border-gray-300"
              style={{ 
                fontSize: '16px',
                borderCollapse: 'collapse'
              }}
            >
              <tbody>
                <tr>
                  {/* SX Button */}
                  <td
                    onClick={() => onSelectX('release', release.release_id)}
                    className={`cursor-pointer font-bold text-center transition-colors ${
                      isSelectX 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={{ padding: '5px', border: '1px solid #ccc', minWidth: '40px' }}
                    title="Select X"
                  >
                    sx
                  </td>
                  
                  {/* VC Button */}
                  <td
                    onClick={() => handleViewChildren(release.release_id)}
                    className={`cursor-pointer text-center transition-colors ${
                      isViewChildren 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={{ padding: '5px', border: '1px solid #ccc', minWidth: '60px' }}
                    title="View Children"
                  >
                    <span className="font-bold">vc</span> - {release.children_count || 0}
                  </td>
                  
                  {/* Release Date */}
                  <td
                    className="text-gray-800"
                    style={{ padding: '5px', border: '1px solid #ccc', minWidth: '100px' }}
                  >
                    {release.release_date || 'No date'}
                  </td>
                  
                  {/* Zip Based Count */}
                  <td
                    className="text-center text-gray-700"
                    style={{ padding: '5px', border: '1px solid #ccc', minWidth: '60px' }}
                    title="Related rows in leadsmart_zip_based_data"
                  >
                    {release.zip_based_count?.toLocaleString()}
                  </td>
                  
                  {/* Transformed Count */}
                  <td
                    className="text-center text-gray-700"
                    style={{ padding: '5px', border: '1px solid #ccc', minWidth: '60px' }}
                    title="Related rows in leadsmart_transformed"
                  >
                    {release.transformed_count?.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          );
        })}
      </div>
    </div>
  );
}

