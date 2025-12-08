'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

interface City {
  city_id: number;
  city_name: string | null;
  state_code: string | null;
  state_full: string | null;
  country: string | null;
  rank_in_pop: number | null;
  gmaps_link: string | null;
  is_suburb: boolean | null;
  city_and_state_code: string | null;
  city_population: number | null;
  latitude: number | null;
  longitude: number | null;
  rel_metro_id: number | null;
  fk_dfs_location_code: number | null;
  qty_of_zips_found_in_leadsmart_zip_codes_list: number | null;
  population_last_updated: string | null;
  created_at: string;
  updated_at: string | null;
}

export default function ExportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCitiesData = async (): Promise<City[]> => {
    const response = await fetch('/api/cities/export');
    if (!response.ok) {
      throw new Error('Failed to fetch cities data');
    }
    const data = await response.json();
    return data.cities;
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToExcel = async () => {
    try {
      setIsLoading(true);
      const cities = await fetchCitiesData();
      
      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(cities);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Cities');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Download file
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cities_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCsv = async () => {
    try {
      setIsLoading(true);
      const cities = await fetchCitiesData();
      
      // Convert to CSV
      if (cities.length === 0) {
        alert('No data to export');
        return;
      }
      
      const headers = Object.keys(cities[0]);
      const csvContent = [
        headers.join(','),
        ...cities.map(city => 
          headers.map(header => {
            const value = city[header as keyof City];
            // Escape commas and quotes in values
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',')
        )
      ].join('\n');
      
      downloadFile(
        csvContent, 
        `cities_export_${new Date().toISOString().split('T')[0]}.csv`, 
        'text/csv'
      );
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('Failed to export to CSV');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToSql = async () => {
    try {
      setIsLoading(true);
      const cities = await fetchCitiesData();
      
      // Generate SQL INSERT statements
      const sqlContent = [
        '-- Cities Export SQL',
        `-- Generated on ${new Date().toISOString()}`,
        '-- Sorted by city_population (largest to smallest)',
        '',
        'CREATE TABLE IF NOT EXISTS cities (',
        '  city_id SERIAL PRIMARY KEY,',
        '  city_name TEXT,',
        '  state_code TEXT,',
        '  state_full TEXT,',
        '  country TEXT,',
        '  rank_in_pop INTEGER,',
        '  gmaps_link TEXT,',
        '  is_suburb BOOLEAN DEFAULT FALSE,',
        '  city_and_state_code TEXT,',
        '  city_population BIGINT,',
        '  latitude NUMERIC,',
        '  longitude NUMERIC,',
        '  rel_metro_id INTEGER,',
        '  fk_dfs_location_code INTEGER,',
        '  qty_of_zips_found_in_leadsmart_zip_codes_list INTEGER,',
        '  population_last_updated TIMESTAMPTZ,',
        '  created_at TIMESTAMPTZ DEFAULT NOW(),',
        '  updated_at TIMESTAMPTZ',
        ');',
        '',
        '-- Clear existing data (uncomment if needed)',
        '-- TRUNCATE TABLE cities RESTART IDENTITY;',
        '',
        '-- Insert city data'
      ];
      
      cities.forEach(city => {
        const formatValue = (value: any) => {
          if (value === null || value === undefined) return 'NULL';
          if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
          if (typeof value === 'number') return value.toString();
          if (typeof value === 'string') {
            // Escape single quotes in strings
            return `'${value.replace(/'/g, "''")}'`;
          }
          return 'NULL';
        };
        
        const values = [
          formatValue(city.city_id),
          formatValue(city.city_name),
          formatValue(city.state_code),
          formatValue(city.state_full),
          formatValue(city.country),
          formatValue(city.rank_in_pop),
          formatValue(city.gmaps_link),
          formatValue(city.is_suburb),
          formatValue(city.city_and_state_code),
          formatValue(city.city_population),
          formatValue(city.latitude),
          formatValue(city.longitude),
          formatValue(city.rel_metro_id),
          formatValue(city.fk_dfs_location_code),
          formatValue(city.qty_of_zips_found_in_leadsmart_zip_codes_list),
          formatValue(city.population_last_updated),
          formatValue(city.created_at),
          formatValue(city.updated_at)
        ].join(', ');
        
        sqlContent.push(
          `INSERT INTO cities (city_id, city_name, state_code, state_full, country, rank_in_pop, gmaps_link, is_suburb, city_and_state_code, city_population, latitude, longitude, rel_metro_id, fk_dfs_location_code, qty_of_zips_found_in_leadsmart_zip_codes_list, population_last_updated, created_at, updated_at) VALUES (${values});`
        );
      });
      
      downloadFile(
        sqlContent.join('\n'), 
        `cities_export_${new Date().toISOString().split('T')[0]}.sql`, 
        'text/sql'
      );
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error exporting to SQL:', error);
      alert('Failed to export to SQL');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors flex items-center space-x-2 disabled:opacity-50"
      >
        <span>📊</span>
        <span>{isLoading ? 'Exporting...' : 'Export'}</span>
        <span className="text-xs">▼</span>
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            <div className="py-1">
              <button
                onClick={exportToExcel}
                disabled={isLoading}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 flex items-center space-x-2"
              >
                <span>📗</span>
                <span>Export as Excel (.xlsx)</span>
              </button>
              
              <button
                onClick={exportToCsv}
                disabled={isLoading}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 flex items-center space-x-2"
              >
                <span>📄</span>
                <span>Export as CSV (.csv)</span>
              </button>
              
              <button
                onClick={exportToSql}
                disabled={isLoading}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 flex items-center space-x-2"
              >
                <span>🗃️</span>
                <span>Export as SQL (.sql)</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}