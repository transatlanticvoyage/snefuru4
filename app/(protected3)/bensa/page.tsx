'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import BensaFieldTable from './components/BensaFieldTable';
import { bensaXpagesConfig } from './config/bensaXpagesConfig';
import { bensaZarnosConfig } from './config/bensaZarnosConfig';
import { bensaUtgsConfig } from './config/bensaUtgsConfig';

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

interface Zarno {
  zarno_id: number;
  fk_xpage_id: number | null;
  zarno_type: string | null;
  zarno_name: string | null;
  zarno_path: string | null;
  zarno_status: string | null;
  zarno_config: any;
  execution_order: number | null;
  dependencies: any;
  metadata: any;
  is_enabled: boolean | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export default function BensaPage() {
  const [activeTab, setActiveTab] = useState<'xpages' | 'utgs' | 'zarnos'>('xpages');
  const [xpages, setXpages] = useState<XPage[]>([]);
  const [utgs, setUtgs] = useState<UTG[]>([]);
  const [zarnos, setZarnos] = useState<Zarno[]>([]);
  const [selectedXpage, setSelectedXpage] = useState<XPage | null>(null);
  const [selectedXpageId, setSelectedXpageId] = useState<number | null>(null);
  const [selectedUtgId, setSelectedUtgId] = useState<string | null>(null);
  const [selectedZarno, setSelectedZarno] = useState<Zarno | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUtgs, setLoadingUtgs] = useState(false);
  const [loadingZarnos, setLoadingZarnos] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    document.title = 'Bensa Field Management System';
    fetchXpages();
    
    // Get xpage_id from URL if present
    const xpageIdParam = searchParams?.get('xpage_id');
    if (xpageIdParam) {
      const xpageId = parseInt(xpageIdParam);
      setSelectedXpageId(xpageId);
      fetchSelectedXpage(xpageId);
    }
    
    // Get utg_id from URL if present
    const utgIdParam = searchParams?.get('utg_id');
    if (utgIdParam) {
      setSelectedUtgId(utgIdParam);
    }
  }, [searchParams]);

  // Fetch UTGs and Zarnos when xpage is selected
  useEffect(() => {
    if (selectedXpageId) {
      fetchRelatedUtgs(selectedXpageId);
      fetchRelatedZarnos(selectedXpageId);
    } else {
      setUtgs([]);
      setZarnos([]);
      setSelectedUtgId(null);
      setSelectedZarno(null);
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

  const fetchRelatedUtgs = async (xpageId: number) => {
    try {
      setLoadingUtgs(true);
      
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

  const fetchRelatedZarnos = async (xpageId: number) => {
    try {
      setLoadingZarnos(true);
      
      const { data, error } = await supabase
        .from('zarnos')
        .select('*')
        .eq('fk_xpage_id', xpageId)
        .order('zarno_name', { ascending: true });

      if (error) {
        console.error('Error fetching Zarnos:', error);
        return;
      }

      setZarnos(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingZarnos(false);
    }
  };

  const handleXpageChange = (xpageId: number) => {
    setSelectedXpageId(xpageId);
    fetchSelectedXpage(xpageId);
    router.push(`/bensa?xpage_id=${xpageId}`);
  };

  const handleUtgChange = (utgId: string) => {
    setSelectedUtgId(utgId);
    const params = new URLSearchParams(searchParams || '');
    params.set('utg_id', utgId);
    router.push(`/bensa?${params.toString()}`);
  };

  // Update handlers for each table
  const handleXpageUpdate = async (field: string, value: any) => {
    if (!selectedXpageId) return;

    try {
      const { error } = await supabase
        .from('xpages')
        .update({ [field]: value })
        .eq('xpage_id', selectedXpageId);

      if (error) {
        console.error('Error updating xpage field:', error);
        return;
      }

      // Update local state
      setSelectedXpage(prev => prev ? { ...prev, [field]: value } : null);
    } catch (error) {
      console.error('Error updating xpage field:', error);
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

      // Update local state - would need to fetch the full UTG record
      // For now, just log success
      console.log('UTG field updated successfully');
    } catch (error) {
      console.error('Error updating utg field:', error);
    }
  };

  const handleZarnoUpdate = async (field: string, value: any) => {
    if (!selectedZarno) return;

    try {
      const { error } = await supabase
        .from('zarnos')
        .update({ [field]: value })
        .eq('zarno_id', selectedZarno.zarno_id);

      if (error) {
        console.error('Error updating zarno field:', error);
        return;
      }

      // Update local state
      setSelectedZarno(prev => prev ? { ...prev, [field]: value } : null);
    } catch (error) {
      console.error('Error updating zarno field:', error);
    }
  };

  const copyTooltipText = () => {
    const text = 'BENSA Field Management System - Reusable table components for database field management';
    navigator.clipboard.writeText(text);
  };

  // Styling from original azo page
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
    borderTop: '2px solid #149a24',
    borderLeft: '2px solid #149a24',
    borderRight: '2px solid #149a24',
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
        <span style={{ fontWeight: 'bold' }}>Bensa Field Management System</span>
        <span style={{ fontWeight: 'normal' }}> (reusable table components)</span>
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
      </div>

      <div style={tabContainerStyle}>
        <ul style={tabListStyle}>
          <li 
            style={activeTab === 'xpages' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('xpages')}
          >
            xpages - field management
          </li>
          <li 
            style={activeTab === 'utgs' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('utgs')}
          >
            utgs - field management
          </li>
          <li 
            style={activeTab === 'zarnos' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('zarnos')}
          >
            zarnos - field management
          </li>
        </ul>
      </div>

      <div style={contentStyle}>
        {!selectedXpageId ? (
          <div style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>
            <p>Please select an XPage from the dropdown above to manage its fields.</p>
          </div>
        ) : (
          <>
            {activeTab === 'xpages' && selectedXpage && (
              <div>
                <h2>XPages Field Management</h2>
                <p>Manage fields for XPage ID: {selectedXpageId}</p>
                <BensaFieldTable
                  config={bensaXpagesConfig}
                  selectedRecord={selectedXpage}
                  onRecordUpdate={handleXpageUpdate}
                />
              </div>
            )}
            
            {activeTab === 'utgs' && (
              <div>
                <h2>UTGs Field Management</h2>
                <p>Manage UTG fields for XPage ID: {selectedXpageId}</p>
                <p>TODO: Implement UTG record selection and display</p>
              </div>
            )}
            
            {activeTab === 'zarnos' && (
              <div>
                <h2>Zarnos Field Management</h2>
                <p>Manage Zarno fields for XPage ID: {selectedXpageId}</p>
                <p>TODO: Implement Zarno record selection and display</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}