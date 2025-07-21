'use client';

import React from 'react';
import { MatrixCore, useColumnVisibilityPreviewData, ColumnVisibilityMatrixProps } from './favaColVisMatrixMaster';
import { getChamberClasses } from '../hooks/usePlutoSettings';

export default function FavaColVisMatPreviewBar(props: ColumnVisibilityMatrixProps & { plutoSettings?: any }) {
  const previewData = useColumnVisibilityPreviewData();

  // Always render the preview bar - use default gray dots if no data
  const hasPreviewData = previewData.isVisible && previewData.visibleColumnPositions.length > 0;

  // Use props if provided, otherwise use data from the hook or defaults
  const finalProps = {
    totalColumns: props.totalColumns ?? previewData.totalColumns,
    visibleColumnPositions: props.visibleColumnPositions ?? (hasPreviewData ? previewData.visibleColumnPositions : []), // Empty array = all gray dots
    activeTemplateName: props.activeTemplateName ?? (hasPreviewData ? previewData.activeTemplateName : ''),
    visibleColumnCount: props.visibleColumnCount ?? (hasPreviewData ? previewData.visibleColumnCount : 0),
    width: props.width ?? '100%',
    height: props.height ?? '30px',
    showInfoOverlay: false, // No overlay for preview
    showLegend: false, // No legend for preview
    compact: props.compact ?? false
  };

  // Create a custom matrix component similar to MatrixCore but with preview label
  const segmentWidth = 100 / finalProps.totalColumns;
  const allColumns = Array.from({ length: finalProps.totalColumns }, (_, i) => i + 1);

  return (
    <div 
      style={{
        width: finalProps.width,
        height: finalProps.height,
        backgroundColor: '#f8f9fa',
        border: '1px solid #e9ecef',
        display: 'flex',
        alignItems: 'center',
        marginBottom: '8px',
        overflow: 'hidden'
      }}
      className={props.plutoSettings ? getChamberClasses(props.plutoSettings, 'harpoon_preview', 'harpoon-preview-chamber') : ''}
    >
      {/* Chamber label box */}
      <div className="chamber-label-box chamber-5" style={{ marginRight: '8px' }}>
        Harpoon Preview
      </div>
      
      {/* Preview label div */}
      <div 
        className="harpoon_label_div"
        style={{
          height: '100%',
          backgroundColor: '#fef3c7', // Light yellow to differentiate from active
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          flexShrink: 0,
          padding: '0 8px'
        }}
      >
        harpoon_colvismat_preview
      </div>
      
      {/* Matrix visualization - takes remaining space */}
      <div style={{
        flex: 1,
        height: '100%',
        position: 'relative'
      }}>
        {/* Background grid lines for each column */}
        {allColumns.map((columnIndex) => {
          const isHighlighted = finalProps.visibleColumnPositions.includes(columnIndex);
          return (
            <div
              key={`preview-segment-${columnIndex}`}
              style={{
                position: 'absolute',
                left: `${(columnIndex - 1) * segmentWidth}%`,
                top: '0',
                width: `${segmentWidth}%`,
                height: '100%',
                backgroundColor: isHighlighted ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                borderRight: columnIndex < finalProps.totalColumns ? '1px solid #dee2e6' : 'none',
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
          transform: 'translateY(-50%)',
          zIndex: 2
        }} />

        {/* Column dots */}
        {allColumns.map((position) => {
          const isVisible = finalProps.visibleColumnPositions.includes(position);
          return (
            <div
              key={`preview-dot-${position}`}
              style={{
                position: 'absolute',
                left: `${(position - 1) * segmentWidth + segmentWidth / 2}%`,
                top: '50%',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isVisible ? '#8b5cf6' : '#9ca3af',
                border: `2px solid ${isVisible ? '#6d28d9' : '#6b7280'}`,
                transform: 'translate(-50%, -50%)',
                zIndex: 3,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease'
              }}
              title={`Column ${position}${isVisible ? ' (visible)' : ' (hidden)'}${finalProps.activeTemplateName ? ` in ${finalProps.activeTemplateName}` : ''}`}
            />
          );
        })}
      </div>
    </div>
  );
}

// Export the preview hook for convenience
export { useColumnVisibilityPreviewData } from './favaColVisMatrixMaster';