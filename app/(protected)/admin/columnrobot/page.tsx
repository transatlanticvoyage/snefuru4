'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function ColumnRobotPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(false);
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
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
            div.main_controls
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
                fontSize: '16px', 
                display: 'flex', 
                alignItems: 'flex-end', 
                maxHeight: '300px', 
                overflow: 'hidden',
                fontWeight: 'bold',
                marginBottom: '8px'
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
                fontSize: '16px', 
                display: 'flex', 
                alignItems: 'flex-end', 
                maxHeight: '300px', 
                overflow: 'hidden',
                fontWeight: 'bold',
                marginBottom: '8px'
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
                fontSize: '16px', 
                display: 'flex', 
                alignItems: 'flex-end', 
                maxHeight: '300px', 
                overflow: 'hidden',
                fontWeight: 'bold',
                marginBottom: '8px'
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
                fontSize: '16px', 
                display: 'flex', 
                alignItems: 'flex-end', 
                maxHeight: '300px', 
                overflow: 'hidden',
                fontWeight: 'bold',
                marginBottom: '8px'
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
                fontSize: '16px', 
                display: 'flex', 
                alignItems: 'flex-end', 
                maxHeight: '300px', 
                overflow: 'hidden',
                fontWeight: 'bold',
                marginBottom: '8px'
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
                fontSize: '16px', 
                display: 'flex', 
                alignItems: 'flex-end', 
                maxHeight: '300px', 
                overflow: 'hidden',
                fontWeight: 'bold',
                marginBottom: '8px'
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