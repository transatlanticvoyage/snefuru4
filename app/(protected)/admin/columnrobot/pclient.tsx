'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function ColumnRobotClient() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Random storage state
  const [rstorData, setRstorData] = useState<string>('');
  const [rstorLoading, setRstorLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Fetch random storage data
  const fetchRstorData = async () => {
    try {
      setRstorLoading(true);
      const { data, error } = await supabase
        .from('admin_random_storage')
        .select('rstor_body')
        .eq('fk_app_page', '/admin/columnrobot')
        .single();

      if (error) {
        console.error('Error fetching rstor data:', error);
        setRstorData('');
      } else {
        const bodyContent = data?.rstor_body ? JSON.stringify(data.rstor_body, null, 2) : '';
        setRstorData(bodyContent);
      }
    } catch (err) {
      console.error('Error:', err);
      setRstorData('');
    } finally {
      setRstorLoading(false);
    }
  };

  // Copy functions
  const handleCopyLabel = () => {
    const labelText = 'admin_random_storage.rstor_body where fk_app_page = /admin/columnrobot';
    navigator.clipboard.writeText(labelText);
  };

  const handleCopyRstorData = () => {
    navigator.clipboard.writeText(rstorData);
  };

  useEffect(() => {
    setLoading(false);
    fetchRstorData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Column Robot</h1>
            <p className="mt-2 text-sm text-gray-600">
              Automated column template management system
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              ← Back to Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Main Controls Section */}
      <div className="main_controls bg-white shadow rounded-lg mb-6" style={{ height: '350px', width: '100%' }}>
        <div className="px-6 py-4">
          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '16px' }}>
            div.main_controls
          </div>
          
          {/* Random Storage Display */}
          <div style={{ marginBottom: '16px' }}>
            {/* Label with copy button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                admin_random_storage.rstor_body where fk_app_page = /admin/columnrobot
              </div>
              <button
                onClick={handleCopyLabel}
                style={{
                  height: '20px',
                  width: '30px',
                  fontSize: '10px',
                  backgroundColor: '#e5e7eb',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                📋
              </button>
            </div>
            
            {/* Copy button and textarea container */}
            <div style={{ width: '400px' }}>
              <button
                onClick={handleCopyRstorData}
                disabled={!rstorData}
                style={{
                  width: '100%',
                  height: '20px',
                  fontSize: '12px',
                  backgroundColor: rstorData ? '#3b82f6' : '#e5e7eb',
                  color: rstorData ? 'white' : '#9ca3af',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px 4px 0 0',
                  cursor: rstorData ? 'pointer' : 'not-allowed',
                  display: 'block',
                  marginBottom: '0px'
                }}
              >
                📋 Copy Content
              </button>
              
              {/* Textarea */}
              <textarea
                value={rstorLoading ? 'Loading...' : rstorData}
                readOnly
                style={{
                  width: '100%',
                  height: '100px',
                  border: '1px solid #d1d5db',
                  borderTop: 'none',
                  borderRadius: '0 0 4px 4px',
                  padding: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  resize: 'none',
                  backgroundColor: '#f9fafb',
                  display: 'block',
                  boxSizing: 'border-box'
                }}
                placeholder="No data found for this page..."
              />
            </div>
          </div>
          
          {/* UTG Selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
            <div style={{ fontSize: '17px' }}>
              <span style={{ fontWeight: 'bold' }}>db table:</span> <span style={{ fontWeight: 'normal' }}>utgs</span>
            </div>
            <select
              style={{
                padding: '6px 12px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option>Select your UTG</option>
            </select>
          </div>
        </div>
      </div>

      {/* Principal Content Section */}
      <div className="princ_content bg-white shadow rounded-lg" style={{ width: '100%' }}>
        <div className="px-6 py-4">
          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '16px' }}>
            div.princ_content
          </div>
          
          {/* 6 Brain Columns */}
          <div style={{ display: 'flex' }}>
            <div className="brain_column" style={{ width: '225px', padding: '8px', border: '3px solid gray' }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
                div.brain_column
              </div>
              <div className="robot_ui_label" style={{ 
                padding: '7px', 
                width: '100%', 
                height: '200px',
                fontSize: '16px', 
                display: 'flex', 
                alignItems: 'flex-end', 
                overflow: 'hidden',
                fontWeight: 'bold',
                marginBottom: '8px',
                wordWrap: 'break-word',
                whiteSpace: 'normal',
                backgroundColor: '#e1e1e1'
              }}>
                ui table grid columns definition utgcd
              </div>
              <textarea
                style={{
                  width: '100%',
                  height: '500px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  padding: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  resize: 'none'
                }}
                placeholder="DB columns / HTML classes..."
              />
            </div>
            
            <div className="brain_column" style={{ width: '225px', padding: '8px', border: '3px solid gray' }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
                div.brain_column
              </div>
              <div className="robot_ui_label" style={{ 
                padding: '7px', 
                width: '100%', 
                height: '200px',
                fontSize: '16px', 
                display: 'flex', 
                alignItems: 'flex-end', 
                overflow: 'hidden',
                fontWeight: 'bold',
                marginBottom: '8px',
                wordWrap: 'break-word',
                whiteSpace: 'normal',
                backgroundColor: '#e1e1e1'
              }}>
                sql view (if any)
              </div>
              <textarea
                style={{
                  width: '100%',
                  height: '500px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  padding: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  resize: 'none'
                }}
                placeholder="DB columns / HTML classes..."
              />
            </div>
            
            <div className="brain_column" style={{ width: '225px', padding: '8px', border: '3px solid gray' }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
                div.brain_column
              </div>
              <div className="robot_ui_label" style={{ 
                padding: '7px', 
                width: '100%', 
                height: '200px',
                fontSize: '16px', 
                display: 'flex', 
                alignItems: 'flex-end', 
                overflow: 'hidden',
                fontWeight: 'bold',
                marginBottom: '8px',
                wordWrap: 'break-word',
                whiteSpace: 'normal',
                backgroundColor: '#e1e1e1'
              }}>
                db tables with fields in the actual columns of this utg
              </div>
              <textarea
                style={{
                  width: '100%',
                  height: '500px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  padding: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  resize: 'none'
                }}
                placeholder="DB columns / HTML classes..."
              />
            </div>
            
            <div className="brain_column" style={{ width: '225px', padding: '8px', border: '3px solid gray' }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
                div.brain_column
              </div>
              <div className="robot_ui_label" style={{ 
                padding: '7px', 
                width: '100%', 
                height: '200px',
                fontSize: '16px', 
                display: 'flex', 
                alignItems: 'flex-end', 
                overflow: 'hidden',
                fontWeight: 'bold',
                marginBottom: '8px',
                wordWrap: 'break-word',
                whiteSpace: 'normal',
                backgroundColor: '#e1e1e1'
              }}>
                list of specific fields
              </div>
              <textarea
                style={{
                  width: '100%',
                  height: '500px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  padding: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  resize: 'none'
                }}
                placeholder="DB columns / HTML classes..."
              />
            </div>
            
            <div className="brain_column" style={{ width: '225px', padding: '8px', border: '3px solid gray' }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
                div.brain_column
              </div>
              <div className="robot_ui_label" style={{ 
                padding: '7px', 
                width: '100%', 
                height: '200px',
                fontSize: '16px', 
                display: 'flex', 
                alignItems: 'flex-end', 
                overflow: 'hidden',
                fontWeight: 'bold',
                marginBottom: '8px',
                wordWrap: 'break-word',
                whiteSpace: 'normal',
                backgroundColor: '#e1e1e1'
              }}>
                entire field set of specific db tables including fields not in the utg for comparison
              </div>
              <textarea
                style={{
                  width: '100%',
                  height: '500px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  padding: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  resize: 'none'
                }}
                placeholder="DB columns / HTML classes..."
              />
            </div>
            
            <div className="brain_column" style={{ width: '225px', padding: '8px', border: '3px solid gray' }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
                div.brain_column
              </div>
              <div className="robot_ui_label" style={{ 
                padding: '7px', 
                width: '100%', 
                height: '200px',
                fontSize: '16px', 
                display: 'flex', 
                alignItems: 'flex-end', 
                overflow: 'hidden',
                fontWeight: 'bold',
                marginBottom: '8px',
                wordWrap: 'break-word',
                whiteSpace: 'normal',
                backgroundColor: '#e1e1e1'
              }}>
                linked db tables
              </div>
              <textarea
                style={{
                  width: '100%',
                  height: '500px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  padding: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  resize: 'none'
                }}
                placeholder="DB columns / HTML classes..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}