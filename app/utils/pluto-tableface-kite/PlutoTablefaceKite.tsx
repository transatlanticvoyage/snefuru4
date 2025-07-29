'use client';

import React from 'react';
import { PlutoTablefaceKiteProps } from './types';
import { PLUTO_CONFIG } from './config';

/**
 * PlutoTablefaceKite Component
 * 
 * A reusable label/button component for marking UI table grids
 * 
 * @example
 * // Basic usage
 * <PlutoTablefaceKite />
 * 
 * @example
 * // Custom text
 * <PlutoTablefaceKite text="custom label" />
 * 
 * @example
 * // Custom styling
 * <PlutoTablefaceKite 
 *   text="special tableface" 
 *   backgroundColor="#ff0000"
 *   fontSize="20px"
 * />
 * 
 * @example
 * // With onClick handler
 * <PlutoTablefaceKite onClick={() => console.log('clicked')} />
 */
const PlutoTablefaceKite: React.FC<PlutoTablefaceKiteProps> = ({
  text = PLUTO_CONFIG.defaultText,
  backgroundColor = PLUTO_CONFIG.styles.backgroundColor,
  borderColor = 'black',
  borderWidth = '1px',
  borderRadius = PLUTO_CONFIG.styles.borderRadius,
  padding = PLUTO_CONFIG.styles.padding,
  fontSize = PLUTO_CONFIG.styles.fontSize,
  fontWeight = PLUTO_CONFIG.styles.fontWeight,
  color = PLUTO_CONFIG.styles.color,
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
    <div className="pluto-tableface-kite-wrapper mb-2">
      <div 
        className={`pluto-tableface-kite ${className}`}
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

export default PlutoTablefaceKite;