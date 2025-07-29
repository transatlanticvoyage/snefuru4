'use client';

import React from 'react';
import { BensaTablefaceKiteProps } from './types';
import { BENSA_CONFIG } from './config';

/**
 * BensaTablefaceKite Component
 * 
 * A reusable label/button component for marking UI table grids
 * 
 * @example
 * // Basic usage
 * <BensaTablefaceKite />
 * 
 * @example
 * // Custom text
 * <BensaTablefaceKite text="custom label" />
 * 
 * @example
 * // Custom styling
 * <BensaTablefaceKite 
 *   text="special tableface" 
 *   backgroundColor="#ff0000"
 *   fontSize="20px"
 * />
 * 
 * @example
 * // With onClick handler
 * <BensaTablefaceKite onClick={() => console.log('clicked')} />
 */
const BensaTablefaceKite: React.FC<BensaTablefaceKiteProps> = ({
  text = BENSA_CONFIG.defaultText,
  backgroundColor = BENSA_CONFIG.styles.backgroundColor,
  borderColor = 'black',
  borderWidth = '1px',
  borderRadius = BENSA_CONFIG.styles.borderRadius,
  padding = BENSA_CONFIG.styles.padding,
  fontSize = BENSA_CONFIG.styles.fontSize,
  fontWeight = BENSA_CONFIG.styles.fontWeight,
  color = BENSA_CONFIG.styles.color,
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
    <div className="bensa-tableface-kite-wrapper mb-2">
      <div 
        className={`bensa-tableface-kite ${className}`}
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

export default BensaTablefaceKite;