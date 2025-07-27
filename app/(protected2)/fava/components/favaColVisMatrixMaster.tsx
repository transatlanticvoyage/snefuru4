'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Shared styling constants - single source of truth
export const MATRIX_STYLES = {
  colors: {
    visibleDot: '#8b5cf6',           // Purple for visible columns
    hiddenDot: '#9ca3af',            // Gray for hidden columns
    visibleBorder: '#6d28d9',        // Purple border for visible
    hiddenBorder: '#6b7280',         // Gray border for hidden
    visibleHover: '#7c3aed',         // Purple hover for visible
    hiddenHover: '#6b7280',          // Gray hover for hidden
    separator: '#dee2e6',            // Vertical separator lines
    baseline: '#6c757d',             // Horizontal baseline
    background: '#f8f9fa',           // Background color
    border: '#e9ecef',               // Main border
    segmentHighlight: 'rgba(139, 92, 246, 0.1)', // Background highlight for visible segments
    infoBackground: 'rgba(255,255,255,0.9)',
    legendBackground: 'rgba(255,255,255,0.8)',
    textPrimary: '#374151',
    textSecondary: '#6c757d'
  },
  dimensions: {
    dotSize: 8,                      // Dot diameter in pixels
    dotBorder: 2,                    // Dot border width
    baselineHeight: 2,               // Horizontal baseline height
    separatorWidth: 1,               // Vertical separator width
    mainBarHeight: 30,               // Main bar height
    tooltipHeight: 20,               // Tooltip height
    tooltipWidth: 500                // Tooltip width
  },
  effects: {
    dotShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transition: 'all 0.2s ease',
    hoverScale: 1.3
  }
};

// Shared interface for matrix props
export interface ColumnVisibilityMatrixProps {
  totalColumns?: number;
  visibleColumnPositions?: number[];
  activeTemplateName?: string;
  visibleColumnCount?: number;
  width?: string;
  height?: string;
  showInfoOverlay?: boolean;
  showLegend?: boolean;
  compact?: boolean;
}

// Shared logic hook for fetching column template data
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
          .from('coltemp_rackui_relations')
          .select(`
            fk_rackui_column_id,
            column_position,
            rackui_columns (
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
        
        // Extract column positions directly from rackui_columns.default_position
        const positions = data?.map(item => {
          const defaultPosition = (item.rackui_columns as any)?.default_position;
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

    // Listen for column template events (support both old and new formats)
    const handleTemplateChange = async (event: any) => {
      const { coltemp_id, coltemp_name, templateId, template } = event.detail;
      
      // Support new CTC event format
      if (templateId && template) {
        await fetchTemplateData(templateId, template.coltemp_name);
      }
      // Support old event format for backward compatibility
      else if (coltemp_id) {
        await fetchTemplateData(coltemp_id, coltemp_name);
      }
    };

    const handleShowAll = () => {
      setMatrixData({
        totalColumns: 32,
        visibleColumnPositions: Array.from({ length: 32 }, (_, i) => i + 1),
        activeTemplateName: 'all',
        visibleColumnCount: 32
      });
    };

    // Handle template loaded event (different structure)
    const handleTemplateLoaded = async (event: any) => {
      const { templateId, utg_id } = event.detail;
      if (templateId) {
        await fetchTemplateData(templateId);
      }
    };

    // Listen for template selection events
    window.addEventListener('fava-template-selected', handleTemplateChange);
    window.addEventListener('fava-template-show-all', handleShowAll);
    window.addEventListener('fava-template-loaded', handleTemplateLoaded);

    // Initialize with default state (show all columns)
    handleShowAll();

    return () => {
      window.removeEventListener('fava-template-selected', handleTemplateChange);
      window.removeEventListener('fava-template-show-all', handleShowAll);
      window.removeEventListener('fava-template-loaded', handleTemplateLoaded);
    };
  }, []);

  return matrixData;
}

// Shared logic hook for preview column template data
export function useColumnVisibilityPreviewData() {
  const [previewData, setPreviewData] = useState({
    totalColumns: 32,
    visibleColumnPositions: [] as number[],
    activeTemplateName: '',
    visibleColumnCount: 0,
    isVisible: false // Track if preview should be shown
  });
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Function to fetch preview template data from database
    const fetchPreviewTemplateData = async (templateId: number, template: any) => {
      if (templateId === -999) {
        // "All" template - all 32 columns
        setPreviewData({
          totalColumns: 32,
          visibleColumnPositions: Array.from({ length: 32 }, (_, i) => i + 1),
          activeTemplateName: 'all',
          visibleColumnCount: 32,
          isVisible: true
        });
        return;
      }

      try {
        // Fetch columns for this template from junction table
        const { data, error } = await supabase
          .from('coltemp_rackui_relations')
          .select(`
            fk_rackui_column_id,
            column_position,
            rackui_columns (
              column_name,
              default_position
            )
          `)
          .eq('fk_coltemp_id', templateId)
          .eq('is_visible', true)
          .order('column_position', { ascending: true });
          
        if (error) {
          console.error('Error fetching preview template columns:', error);
          return;
        }
        
        // Extract column positions directly from rackui_columns.default_position
        const positions = data?.map(item => {
          const defaultPosition = (item.rackui_columns as any)?.default_position;
          return parseInt(defaultPosition);
        }).filter(pos => pos && pos >= 1 && pos <= 32) || [];
        
        setPreviewData({
          totalColumns: 32,
          visibleColumnPositions: positions,
          activeTemplateName: template?.coltemp_name || `Template ${templateId}`,
          visibleColumnCount: positions.length,
          isVisible: true
        });
      } catch (error) {
        console.error('Error fetching preview template data:', error);
      }
    };

    // Listen for template hover events (triggered by any template button hover)
    const handleTemplateHover = async (event: any) => {
      const { templateId, template } = event.detail;
      if (templateId && template) {
        await fetchPreviewTemplateData(templateId, template);
      }
    };

    // Listen for hover events
    window.addEventListener('fava-template-hover', handleTemplateHover);

    return () => {
      window.removeEventListener('fava-template-hover', handleTemplateHover);
    };
  }, []);

  return previewData;
}

// Hook to fetch specific coltemp data (for tooltips)
export function useSpecificColtempData(coltempId: number) {
  const [matrixData, setMatrixData] = useState({
    totalColumns: 32,
    visibleColumnPositions: [] as number[],
    activeTemplateName: '',
    visibleColumnCount: 0
  });
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchTemplateData = async () => {
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
          .from('coltemp_rackui_relations')
          .select(`
            fk_rackui_column_id,
            column_position,
            rackui_columns (
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
        
        // Extract column positions directly from rackui_columns.default_position
        const positions = data?.map(item => {
          const defaultPosition = (item.rackui_columns as any)?.default_position;
          return parseInt(defaultPosition);
        }).filter(pos => pos && pos >= 1 && pos <= 32) || [];
        
        setMatrixData({
          totalColumns: 32,
          visibleColumnPositions: positions,
          activeTemplateName: `Template ${coltempId}`,
          visibleColumnCount: positions.length
        });
      } catch (error) {
        console.error('Error fetching template data:', error);
      }
    };

    if (coltempId) {
      fetchTemplateData();
    }
  }, [coltempId]);

  return matrixData;
}

// Shared matrix rendering component
export function MatrixCore({
  totalColumns = 32,
  visibleColumnPositions = [],
  activeTemplateName = '',
  visibleColumnCount = 0,
  width = '100%',
  height = '30px',
  showInfoOverlay = true,
  showLegend = true,
  compact = false
}: ColumnVisibilityMatrixProps) {
  // Calculate the width of each column segment
  const segmentWidth = 100 / totalColumns; // Percentage width per column

  // Generate array of all column positions for rendering
  const allColumns = Array.from({ length: totalColumns }, (_, i) => i + 1);

  return (
    <div style={{
      width,
      height,
      backgroundColor: MATRIX_STYLES.colors.background,
      border: `1px solid ${MATRIX_STYLES.colors.border}`,
      display: 'flex',
      alignItems: 'center',
      marginBottom: compact ? '0' : '8px',
      overflow: 'hidden'
    }}>
      {/* Chamber label box */}
      <div className="chamber-label-box chamber-6" style={{ marginRight: '8px' }}>
        Harpoon Active
      </div>
      
      {/* Label div - sizes to content */}
      <div 
        className="harpoon_label_div"
        style={{
          height: '100%',
          backgroundColor: '#e9ecef',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          flexShrink: 0,
          padding: '0 8px'
        }}
      >
        harpoon_colvismat_active
      </div>
      
      {/* Matrix visualization - takes remaining space */}
      <div style={{
        flex: 1,
        height: '100%',
        position: 'relative'
      }}>
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
              backgroundColor: isHighlighted ? MATRIX_STYLES.colors.segmentHighlight : 'transparent',
              borderRight: columnIndex < totalColumns ? `${MATRIX_STYLES.dimensions.separatorWidth}px solid ${MATRIX_STYLES.colors.separator}` : 'none',
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
        height: `${MATRIX_STYLES.dimensions.baselineHeight}px`,
        backgroundColor: MATRIX_STYLES.colors.baseline,
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
              width: `${MATRIX_STYLES.dimensions.dotSize}px`,
              height: `${MATRIX_STYLES.dimensions.dotSize}px`,
              borderRadius: '50%',
              backgroundColor: isVisible ? MATRIX_STYLES.colors.visibleDot : MATRIX_STYLES.colors.hiddenDot,
              border: `${MATRIX_STYLES.dimensions.dotBorder}px solid ${isVisible ? MATRIX_STYLES.colors.visibleBorder : MATRIX_STYLES.colors.hiddenBorder}`,
              transform: 'translate(-50%, -50%)',
              zIndex: 3,
              boxShadow: MATRIX_STYLES.effects.dotShadow,
              cursor: 'pointer',
              transition: MATRIX_STYLES.effects.transition
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = `translate(-50%, -50%) scale(${MATRIX_STYLES.effects.hoverScale})`;
              if (isVisible) {
                e.currentTarget.style.backgroundColor = MATRIX_STYLES.colors.visibleHover;
              } else {
                e.currentTarget.style.backgroundColor = MATRIX_STYLES.colors.hiddenHover;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
              e.currentTarget.style.backgroundColor = isVisible ? MATRIX_STYLES.colors.visibleDot : MATRIX_STYLES.colors.hiddenDot;
            }}
            title={`Column ${position}${isVisible ? ' (visible)' : ' (hidden)'}${activeTemplateName ? ` in ${activeTemplateName}` : ''}`}
          />
        );
      })}

      </div>
    </div>
  );
}