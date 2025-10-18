'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';

interface FileRelease {
  release_id: number;
  release_date: string | null;
  sheet_link: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  result_count?: number;
}

interface Props {
  onReleaseSelect: (releaseId: number | null) => void;
  selectXType: 'release' | 'subsheet' | 'subpart' | null;
  selectXId: number | null;
  onSelectX: (type: 'release' | 'subsheet' | 'subpart', id: number) => void;
}

export default function SelectorFileReleasesGrid({ onReleaseSelect, selectXType, selectXId, onSelectX }: Props) {
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
      
      // Fetch counts for each release
      const releasesWithCounts = await Promise.all((data || []).map(async (release) => {
        const { count } = await supabase
          .from('leadsmart_zip_based_data')
          .select('*', { count: 'exact', head: true })
          .eq('rel_release_id', release.release_id);
        
        return {
          ...release,
          result_count: count || 0
        };
      }));
      
      setReleases(releasesWithCounts);
      
      // Auto-select the entry with the most recent release_date
      if (releasesWithCounts.length > 0) {
        const releasesWithDates = releasesWithCounts.filter(r => r.release_date);
        
        if (releasesWithDates.length > 0) {
          const mostRecent = releasesWithDates.reduce((latest, current) => {
            if (!latest.release_date) return current;
            if (!current.release_date) return latest;
            return current.release_date > latest.release_date ? current : latest;
          });
          
          setSelectedReleaseId(mostRecent.release_id);
        } else {
          setSelectedReleaseId(releasesWithCounts[0].release_id);
        }
      }
    } catch (error) {
      console.error('Error fetching releases:', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  const handleCheckboxClick = (releaseId: number) => {
    setSelectedReleaseId(releaseId);
    onReleaseSelect(releaseId);
  };
  
  // Notify parent when auto-selected on load
  useEffect(() => {
    if (selectedReleaseId !== null) {
      onReleaseSelect(selectedReleaseId);
    }
  }, [selectedReleaseId, onReleaseSelect]);

  if (loading) {
    return <div className="p-4 text-sm text-gray-600">Loading...</div>;
  }

  return (
    <div className="flex flex-col">
      <div className="p-4 border-b bg-gray-50">
        <div className="font-bold text-gray-800 mb-3" style={{ fontSize: '16px' }}>
          leadsmart_file_releases
        </div>
      </div>
      
      <div className="overflow-auto p-4">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-200 sticky top-0 z-10">
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase', width: '100px' }}>
                # results
              </th>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', width: '150px' }}>
                select_x
              </th>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', width: '150px' }}>
                view children
              </th>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }}>
                release_id
              </th>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }}>
                release_date
              </th>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }}>
                sheet_link
              </th>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }}>
                created_at
              </th>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }}>
                updated_at
              </th>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }}>
                created_by
              </th>
            </tr>
          </thead>
          <tbody>
            {releases.map((release) => {
              const isSelectedX = selectXType === 'release' && selectXId === release.release_id;
              
              const rowRef = (el: HTMLTableRowElement | null) => {
                if (el) {
                  el.style.setProperty('background-color', isSelectedX ? '#d1fae5' : 'white', 'important');
                }
              };
              
              return (
                <tr 
                  key={release.release_id}
                  ref={rowRef}
                  onMouseEnter={(e) => {
                    if (!isSelectedX) {
                      e.currentTarget.style.setProperty('background-color', '#f9fafb', 'important');
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelectedX) {
                      e.currentTarget.style.setProperty('background-color', 'white', 'important');
                    }
                  }}
                >
                  <td className="border border-gray-300 px-2 py-1 text-center font-bold text-blue-600">
                    {release.result_count || 0}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <div className="flex items-center" style={{ gap: 0 }}>
                      <input
                        type="checkbox"
                        checked={isSelectedX}
                        onChange={() => onSelectX('release', release.release_id)}
                        className="cursor-pointer"
                        style={{ width: '20px', height: '32px', margin: 0, borderRadius: 0 }}
                      />
                      <button
                        onClick={() => onSelectX('release', release.release_id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 font-medium transition-colors"
                        style={{ height: '32px', borderRadius: 0 }}
                      >
                        select_x
                      </button>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <div className="flex items-center" style={{ gap: 0 }}>
                      <input
                        type="checkbox"
                        checked={selectedReleaseId === release.release_id}
                        onChange={() => handleCheckboxClick(release.release_id)}
                        className="cursor-pointer"
                        style={{ width: '20px', height: '32px', margin: 0, borderRadius: 0 }}
                      />
                      <button
                        onClick={() => handleCheckboxClick(release.release_id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 font-medium transition-colors"
                        style={{ height: '32px', borderRadius: 0 }}
                      >
                        view children
                      </button>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-2 py-1 font-mono">{release.release_id}</td>
                <td className="border border-gray-300 px-2 py-1">{release.release_date || ''}</td>
                <td className="border border-gray-300 px-2 py-1">{release.sheet_link || ''}</td>
                <td className="border border-gray-300 px-2 py-1 text-gray-600 text-xs">
                  {release.created_at ? new Date(release.created_at).toLocaleString() : ''}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-gray-600 text-xs">
                  {release.updated_at ? new Date(release.updated_at).toLocaleString() : ''}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-gray-600 font-mono text-xs">
                  {release.created_by || ''}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

