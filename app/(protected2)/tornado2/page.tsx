'use client';

import React, { useEffect, useState } from 'react';
import AzHeader from '../azulp1/components/AzHeader';
import AzSidebar from '../azulp1/components/AzSidebar';
import AzNavToggle from '../azulp1/components/AzNavToggle';
import '../azulp1/styles/az-navigation.css';

export default function Tornado2Page() {
  const [navVisible, setNavVisible] = useState(true);

  useEffect(() => {
    document.title = 'Tornado2 - Weather Monitor';
    
    // Check navigation visibility from localStorage
    const savedVisibility = localStorage.getItem('az-nav-visible');
    if (savedVisibility !== null) {
      setNavVisible(JSON.parse(savedVisibility));
    }
    
    // Listen for navigation visibility changes
    const handleStorageChange = () => {
      const visibility = localStorage.getItem('az-nav-visible');
      if (visibility !== null) {
        setNavVisible(JSON.parse(visibility));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <>
      <AzNavToggle />
      <AzHeader />
      <AzSidebar />
      <div style={{ 
        paddingTop: navVisible ? '60px' : '0', 
        paddingLeft: navVisible ? '250px' : '0',
        padding: '20px',
        transition: 'padding 0.3s ease'
      }}>
        <h1 style={{ marginBottom: '20px', color: '#1e293b' }}>
          Tornado2 Weather Monitoring System
        </h1>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h3 style={{ color: '#dc2626', marginBottom: '10px' }}>🌪️ Active Alerts</h3>
            <p style={{ color: '#991b1b', margin: '0', fontSize: '14px' }}>
              Monitor real-time tornado warnings and severe weather alerts in your area.
            </p>
          </div>
          
          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h3 style={{ color: '#2563eb', marginBottom: '10px' }}>📡 Weather Radar</h3>
            <p style={{ color: '#1d4ed8', margin: '0', fontSize: '14px' }}>
              View live Doppler radar imagery and track storm movement patterns.
            </p>
          </div>
          
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h3 style={{ color: '#16a34a', marginBottom: '10px' }}>📊 Forecasts</h3>
            <p style={{ color: '#15803d', margin: '0', fontSize: '14px' }}>
              Access detailed weather forecasts and probability assessments.
            </p>
          </div>
          
          <div style={{
            background: '#fefce8',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h3 style={{ color: '#ca8a04', marginBottom: '10px' }}>🚨 Emergency</h3>
            <p style={{ color: '#a16207', margin: '0', fontSize: '14px' }}>
              Quick access to emergency procedures and evacuation information.
            </p>
          </div>
        </div>
        
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h2 style={{ color: '#1e293b', marginBottom: '15px' }}>Simplified Az Navigation Demo</h2>
          <p style={{ color: '#4b5563', marginBottom: '15px' }}>
            This page now uses the simplified navigation system from azulp1:
          </p>
          <ul style={{ color: '#4b5563', paddingLeft: '20px' }}>
            <li>Imports navigation components from ../azulp1/components/</li>
            <li>Uses the same navigation data from /api/navigation</li>
            <li>Toggle button shows/hides both header and sidebar</li>
            <li>Navigation state is saved in localStorage</li>
            <li>No complex template system - just simple, reusable components</li>
          </ul>
        </div>
      </div>
    </>
  );
}