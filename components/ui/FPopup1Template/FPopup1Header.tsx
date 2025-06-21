'use client';

import { FPopup1HeaderProps } from './types';

export const FPopup1Header = ({ 
  config, 
  colors, 
  currentUrl, 
  onClose, 
  closeButtonConfig = {} 
}: FPopup1HeaderProps) => {
  const { width = '260px', height = '100px', text = '×' } = closeButtonConfig;

  return (
    <>
      {config.map((headerConfig, index) => (
        <div
          key={index}
          className="absolute left-0 right-0 flex items-center px-4"
          style={{
            top: `${index * 50}px`,
            height: '50px',
            backgroundColor: colors[headerConfig.colorScheme]?.bg || '#2563eb',
            color: colors[headerConfig.colorScheme]?.text || '#ffffff'
          }}
        >
          <span className="font-semibold">{headerConfig.label}</span>
          
          {/* Vertical separator */}
          <div 
            className="bg-gray-600"
            style={{
              width: '3px',
              height: '100%',
              marginLeft: '30px',
              marginRight: '30px'
            }}
          />
          
          {headerConfig.type === 'url-display' && (
            <span className="font-mono text-sm overflow-hidden whitespace-nowrap text-ellipsis flex-1">
              {currentUrl}
            </span>
          )}
          
          {headerConfig.type === 'pathname-actions' && (
            <>
              <span className="font-bold">
                {typeof window !== 'undefined' ? window.location.pathname : ''}
              </span>
              
              {headerConfig.actions?.map((action, actionIndex) => (
                <div key={actionIndex}>
                  {action.type === 'checkbox' && (
                    <div 
                      className="ml-4 flex items-center cursor-pointer"
                      style={{
                        color: colors[headerConfig.colorScheme]?.text || '#ffffff',
                        padding: '8px',
                        border: '1px solid black',
                        fontSize: '16px'
                      }}
                      onClick={action.onClick}
                    >
                      <input
                        type="checkbox"
                        className="mr-2 pointer-events-none"
                        checked={action.checked}
                        readOnly
                        style={{
                          width: '18px',
                          height: '18px'
                        }}
                      />
                      {action.label}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      ))}
      
      {/* Close button - spans all header bars */}
      <button
        onClick={onClose}
        className="absolute right-0 top-0 bg-gray-400 text-gray-800 font-bold flex items-center justify-center hover:bg-gray-500 transition-colors"
        style={{
          width: width,
          height: height,
          border: '2px solid #4a4a4a',
          fontSize: '24px'
        }}
      >
        {text}
      </button>
    </>
  );
};