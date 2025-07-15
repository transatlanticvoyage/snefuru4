'use client';

import React from 'react';
import { MatrixCore, useSpecificColtempData, MATRIX_STYLES } from './favaColVisMatrixMaster';

interface ColumnVisibilityMatrixTooltipProps {
  coltempId: number;
  isVisible: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function FavaColVisMatTooltip({
  coltempId,
  isVisible,
  onMouseEnter,
  onMouseLeave
}: ColumnVisibilityMatrixTooltipProps) {
  const matrixData = useSpecificColtempData(coltempId);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: `${MATRIX_STYLES.dimensions.tooltipWidth}px`,
        height: `${MATRIX_STYLES.dimensions.tooltipHeight}px`,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        marginBottom: '8px'
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Triangle pointer */}
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid white',
          zIndex: 1001
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '9px solid transparent',
          borderRight: '9px solid transparent',
          borderTop: '9px solid #ccc',
          zIndex: 1000,
          marginTop: '1px'
        }}
      />

      {/* Matrix content */}
      <div style={{ padding: '0', height: '100%' }}>
        <MatrixCore
          totalColumns={matrixData.totalColumns}
          visibleColumnPositions={matrixData.visibleColumnPositions}
          activeTemplateName={matrixData.activeTemplateName}
          visibleColumnCount={matrixData.visibleColumnCount}
          width="100%"
          height="100%"
          showInfoOverlay={false}
          showLegend={false}
          compact={true}
        />
      </div>
    </div>
  );
}