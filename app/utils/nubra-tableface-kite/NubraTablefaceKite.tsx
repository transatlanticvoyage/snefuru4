'use client';

import React from 'react';
import { NubraTablefaceKiteProps } from './types';
import { NUBRA_CONFIG } from './config';

/**
 * NubraTablefaceKite Component
 * 
 * A reusable label/button component for marking UI table grids
 * 
 * @example
 * // Basic usage
 * <NubraTablefaceKite />
 * 
 * @example
 * // Custom text
 * <NubraTablefaceKite text="custom label" />
 * 
 * @example
 * // Custom styling
 * <NubraTablefaceKite 
 *   text="special tableface" 
 *   backgroundColor="#ff0000"
 *   fontSize="20px"
 * />
 * 
 * @example
 * // With onClick handler
 * <NubraTablefaceKite onClick={() => console.log('clicked')} />
 */
const NubraTablefaceKite: React.FC<NubraTablefaceKiteProps> = ({
  text = NUBRA_CONFIG.defaultText,
  backgroundColor = NUBRA_CONFIG.styles.backgroundColor,
  borderColor = 'black',
  borderWidth = '1px',
  borderRadius = NUBRA_CONFIG.styles.borderRadius,
  padding = NUBRA_CONFIG.styles.padding,
  fontSize = NUBRA_CONFIG.styles.fontSize,
  fontWeight = NUBRA_CONFIG.styles.fontWeight,
  color = NUBRA_CONFIG.styles.color,
  className = '',
  style = {},
  onClick
}) => {
  // Construct the border string from individual props
  const border = `${borderWidth} solid ${borderColor}`;

  // Combine all styles
  const combinedStyles: React.CSSProperties = {
    backgroundColor,
    border,
    borderRadius,
    padding,
    fontSize,
    fontWeight: fontWeight as React.CSSProperties['fontWeight'],
    color,
    display: 'inline-block',
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
    ...style // Allow override with custom styles
  };

  return (
    <div className="nubra-tableface-kite-wrapper mb-2">
      <div 
        className={`nubra-tableface-kite ${className}`}
        style={combinedStyles}
        onClick={onClick}
        role={onClick ? 'button' : 'presentation'}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        } : undefined}
      >
        {text}
      </div>
    </div>
  );
};

export default NubraTablefaceKite;