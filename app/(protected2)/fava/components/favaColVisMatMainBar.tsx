'use client';

import React from 'react';
import { MatrixCore, useColumnVisibilityData, ColumnVisibilityMatrixProps } from './favaColVisMatrixMaster';

export default function FavaColVisMatMainBar(props: ColumnVisibilityMatrixProps) {
  const matrixData = useColumnVisibilityData();

  // Use props if provided, otherwise use data from the hook
  const finalProps = {
    totalColumns: props.totalColumns ?? matrixData.totalColumns,
    visibleColumnPositions: props.visibleColumnPositions ?? matrixData.visibleColumnPositions,
    activeTemplateName: props.activeTemplateName ?? matrixData.activeTemplateName,
    visibleColumnCount: props.visibleColumnCount ?? matrixData.visibleColumnCount,
    width: props.width ?? '100%',
    height: props.height ?? '30px',
    showInfoOverlay: props.showInfoOverlay ?? true,
    showLegend: props.showLegend ?? true,
    compact: props.compact ?? false
  };

  return <MatrixCore {...finalProps} />;
}

// Export the hook for backward compatibility
export { useColumnVisibilityData } from './favaColVisMatrixMaster';