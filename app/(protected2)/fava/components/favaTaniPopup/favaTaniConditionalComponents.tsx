'use client';

import React, { ReactNode } from 'react';
import { useFavaTaniSafe } from './favaTaniConditionalProvider';
import FavaTaniModal from './favaTaniModal';

/**
 * Conditional Components for FavaTani System
 * 
 * These components render only when the Tani system is enabled and active.
 * When disabled, they return null, ensuring zero interference with Fava.
 * 
 * This approach guarantees that disabled Tani components leave no DOM trace.
 */

interface ConditionalComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders children only when Tani system is enabled
 */
export function FavaTaniConditional({ children, fallback = null }: ConditionalComponentProps) {
  const tani = useFavaTaniSafe();
  
  if (!tani) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Renders the trigger button only when enabled
 */
export function FavaTaniButtonConditional({ fallback = null }: { fallback?: ReactNode }) {
  const tani = useFavaTaniSafe();
  
  if (!tani || !tani.state.flags.components.button) {
    return <>{fallback}</>;
  }
  
  const { config, flags } = tani.state;
  const { openPopup } = tani.actions;
  
  const buttonConfig = config.button || {};
  const text = buttonConfig.text || 'tani popup';
  
  return (
    <button
      onClick={openPopup}
      className={`fava-tani-trigger-button font-bold text-white rounded ${buttonConfig.className || ''}`}
      style={{
        backgroundColor: '#800000', // maroon color like nwjar1
        fontSize: '16px',
        paddingLeft: '12px',
        paddingRight: '12px',
        paddingTop: '8px',
        paddingBottom: '8px',
        border: 'none',
        cursor: 'pointer',
        marginLeft: '20px',
        display: 'inline-block',
        ...buttonConfig.style
      }}
      title={buttonConfig.hotkey ? `${text} (Press ${buttonConfig.hotkey.toUpperCase()})` : text}
    >
      {buttonConfig.icon && <span style={{ marginRight: '8px' }}>{buttonConfig.icon}</span>}
      {text}
    </button>
  );
}

/**
 * Renders the popup modal only when enabled and open
 * 
 * IMPORTANT: This component ONLY supports the /nwjar1-style modal with:
 * - Dual header bars (uelbar37 & uelbar38)
 * - Full-screen layout (95vw x 95vh)
 * - 7-tab navigation system
 * - Database-driven colors
 * 
 * NO OTHER MODAL STYLES ARE SUPPORTED - do not attempt to bypass FavaTaniModal
 */
export function FavaTaniPopupConditional({ children }: { children: ReactNode }) {
  const tani = useFavaTaniSafe();
  
  if (!tani || !tani.state.flags.components.popup) {
    return null;
  }
  
  // SECURITY: Only FavaTaniModal is allowed - no simple popup fallbacks
  return (
    <FavaTaniModal>
      {children}
    </FavaTaniModal>
  );
}

/**
 * Renders URL sync functionality only when enabled
 */
export function FavaTaniUrlSyncConditional() {
  const tani = useFavaTaniSafe();
  
  if (!tani || !tani.state.flags.components.urlSync) {
    return null;
  }
  
  // URL sync is handled in the provider - this is just a marker component
  return null;
}

/**
 * Higher-order component for conditional feature rendering
 */
export function withFavaTaniConditional<P extends object>(
  Component: React.ComponentType<P>,
  featureCheck?: (flags: any) => boolean
) {
  return function ConditionalComponent(props: P) {
    const tani = useFavaTaniSafe();
    
    if (!tani) {
      return null;
    }
    
    if (featureCheck && !featureCheck(tani.state.flags)) {
      return null;
    }
    
    return <Component {...props} />;
  };
}

/**
 * Debug component - only renders in development with debug flags
 */
export function FavaTaniDebugConditional({ children }: ConditionalComponentProps) {
  const tani = useFavaTaniSafe();
  
  if (!tani || !tani.state.flags.debugging.consoleLogging || process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return <>{children}</>;
}

/**
 * Safe wrapper for any Tani-related content
 */
export function FavaTaniSafeWrapper({ 
  children, 
  fallback = null,
  requireFeature
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
  requireFeature?: keyof any; // Can be extended to specific feature keys
}) {
  const tani = useFavaTaniSafe();
  
  if (!tani) {
    return <>{fallback}</>;
  }
  
  if (requireFeature && !tani.state.flags.components[requireFeature as keyof typeof tani.state.flags.components]) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

export default {
  FavaTaniConditional,
  FavaTaniButtonConditional,
  FavaTaniPopupConditional,
  FavaTaniUrlSyncConditional,
  FavaTaniDebugConditional,
  FavaTaniSafeWrapper,
  withFavaTaniConditional
};