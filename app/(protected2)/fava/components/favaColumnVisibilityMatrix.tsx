'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ColumnVisibilityMatrixProps {
  // Total columns in the "all view" (baseline)
  totalColumns?: number;
  // Currently visible column positions (1-indexed positions in the all view)
  visibleColumnPositions?: number[];
  // Optional: column template name for display
  activeTemplateName?: string;
  // Optional: total count of visible columns
  visibleColumnCount?: number;
}

export default function FavaColumnVisibilityMatrix({
  totalColumns = 32, // Default based on torna3 which has 32 columns in "all" view
  visibleColumnPositions = [],
  activeTemplateName = '',
  visibleColumnCount = 0
}: ColumnVisibilityMatrixProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Calculate the width of each column segment
  const segmentWidth = 100 / totalColumns; // Percentage width per column

  // Generate array of all column positions for rendering
  const allColumns = Array.from({ length: totalColumns }, (_, i) => i + 1);

  return (
    <div style={{
      width: '100%',
      height: '30px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #e9ecef',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      marginBottom: '8px',
      overflow: 'hidden'
    }}>

        <div style={{
        //  position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          zIndex: 1
        }}>Darpon</div>


      {/* Background grid lines for each column */}
      {allColumns.map((columnIndex) => {
        const isHighlighted = visibleColumnPositions.includes(columnIndex);
        return (
          <div
            key={`segment-${columnIndex}`}
            style={{
              position: 'absolute',
              left: `${(columnIndex - 1) * segmentWidth}%`,
              top: '0',
              width: `${segmentWidth}%`,
              height: '100%',
              backgroundColor: isHighlighted ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
              borderRight: columnIndex < totalColumns ? '1px solid #dee2e6' : 'none',
              zIndex: 1
            }}
            title={`Column ${columnIndex}${isHighlighted ? ' (visible)' : ' (hidden)'}`}
          />
        );
      })}

      {/* Horizontal baseline */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '0',
        right: '0',
        height: '2px',
        backgroundColor: '#6c757d',
        zIndex: 2,
        transform: 'translateY(-50%)'
      }} />

      {/* Dots for all column positions - gray for hidden, purple for visible */}
      {allColumns.map((position) => {
        const isVisible = visibleColumnPositions.includes(position);
        const leftPosition = ((position - 1) * segmentWidth) + (segmentWidth / 2);
        
        return (
          <div
            key={`dot-${position}`}
            style={{
              position: 'absolute',
              left: `${leftPosition}%`,
              top: '50%',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isVisible ? '#8b5cf6' : '#9ca3af', // Purple for visible, gray for hidden
              border: `2px solid ${isVisible ? '#6d28d9' : '#6b7280'}`,
              transform: 'translate(-50%, -50%)',
              zIndex: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.3)';
              if (isVisible) {
                e.currentTarget.style.backgroundColor = '#7c3aed';
              } else {
                e.currentTarget.style.backgroundColor = '#6b7280';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
              e.currentTarget.style.backgroundColor = isVisible ? '#8b5cf6' : '#9ca3af';
            }}
            title={`Column ${position}${isVisible ? ' (visible)' : ' (hidden)'}${activeTemplateName ? ` in ${activeTemplateName}` : ''}`}
          />
        );
      })}

      {/* Info overlay */}
      <div style={{
        position: 'absolute',
        top: '2px',
        left: '4px',
        fontSize: '11px',
        color: '#374151',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: '2px 6px',
        borderRadius: '3px',
        zIndex: 4,
        pointerEvents: 'none',
        fontWeight: '500',
        border: '1px solid rgba(0,0,0,0.1)'
      }}>
        {visibleColumnCount > 0 && visibleColumnCount < totalColumns
          ? `${visibleColumnCount}/${totalColumns} columns (${activeTemplateName})`
          : visibleColumnCount === totalColumns
          ? `All ${totalColumns} columns`
          : `${totalColumns} total columns`
        }
      </div>

      {/* Legend on the right */}
      <div style={{
        position: 'absolute',
        top: '2px',
        right: '4px',
        fontSize: '10px',
        color: '#6c757d',
        backgroundColor: 'rgba(255,255,255,0.8)',
        padding: '1px 4px',
        borderRadius: '2px',
        zIndex: 4,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#8b5cf6'
        }} />
        <span>visible</span>
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#9ca3af',
          marginLeft: '8px'
        }} />
        <span>hidden</span>
      </div>
    </div>
  );
}

// Hook to listen for column template changes and connect to real data
export function useColumnVisibilityData() {
  const [matrixData, setMatrixData] = useState({
    totalColumns: 32,
    visibleColumnPositions: [] as number[],
    activeTemplateName: '',
    visibleColumnCount: 0
  });
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Function to fetch real column template data from database
    const fetchTemplateData = async (coltempId: number, templateName?: string) => {
      if (coltempId === -999) {
        // "All" template - all 32 columns
        setMatrixData({
          totalColumns: 32,
          visibleColumnPositions: Array.from({ length: 32 }, (_, i) => i + 1),
          activeTemplateName: 'all',
          visibleColumnCount: 32
        });
        return;
      }

      try {
        // Fetch columns for this template from junction table
        const { data, error } = await supabase
          .from('coltemp_denbu_relations')
          .select(`
            fk_denbu_column_id,
            column_position,
            denbu_columns (
              column_name,
              default_position
            )
          `)
          .eq('fk_coltemp_id', coltempId)
          .eq('is_visible', true)
          .order('column_position', { ascending: true });
          
        if (error) {
          console.error('Error fetching template columns:', error);
          return;
        }
        
        // Extract column positions directly from denbu_columns.default_position
        const positions = data?.map(item => {
          const defaultPosition = (item.denbu_columns as any)?.default_position;
          return parseInt(defaultPosition);
        }).filter(pos => pos && pos >= 1 && pos <= 32) || [];
        
        console.log(`Template ${coltempId} (${templateName}): positions =`, positions);
        
        setMatrixData({
          totalColumns: 32,
          visibleColumnPositions: positions,
          activeTemplateName: templateName || `Template ${coltempId}`,
          visibleColumnCount: positions.length
        });
      } catch (error) {
        console.error('Error fetching template data:', error);
      }
    };

    // Listen for column template events
    const handleTemplateChange = async (event: any) => {
      const { coltemp_id, coltemp_name } = event.detail;
      await fetchTemplateData(coltemp_id, coltemp_name);
    };

    const handleShowAll = () => {
      setMatrixData({
        totalColumns: 32,
        visibleColumnPositions: Array.from({ length: 32 }, (_, i) => i + 1),
        activeTemplateName: 'all',
        visibleColumnCount: 32
      });
    };

    // Listen for template selection events
    window.addEventListener('fava-template-selected', handleTemplateChange);
    window.addEventListener('fava-template-show-all', handleShowAll);
    window.addEventListener('fava-template-loaded', handleTemplateChange);

    // Initialize with default state (show all columns)
    handleShowAll();

    return () => {
      window.removeEventListener('fava-template-selected', handleTemplateChange);
      window.removeEventListener('fava-template-show-all', handleShowAll);
      window.removeEventListener('fava-template-loaded', handleTemplateChange);
    };
  }, []);

  return matrixData;
}