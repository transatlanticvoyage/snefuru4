'use client';

import React from 'react';

interface VacuumMedallionProps {
  siteId: string;
  onMedallionClick?: (medallionType: string, siteId: string) => void;
  onFiller1aClick?: (actionType: string, siteId: string) => void;
  onFiller1bClick?: (actionType: string, siteId: string) => void;
}

const VacuumMedallion: React.FC<VacuumMedallionProps> = ({
  siteId,
  onMedallionClick,
  onFiller1aClick,
  onFiller1bClick
}) => {

  const handleMedallionClick = () => {
    if (onMedallionClick) {
      onMedallionClick('vacuum_medallion', siteId);
    } else {
      console.log('vacuum_medallion', siteId);
    }
  };

  const handleFiller1aClick = () => {
    if (onFiller1aClick) {
      onFiller1aClick('vacuum-filler1a', siteId);
    } else {
      console.log('vacuum-filler1a', siteId);
    }
  };

  const handleFiller1bClick = () => {
    if (onFiller1bClick) {
      onFiller1bClick('vacuum-filler1b', siteId);
    } else {
      console.log('vacuum-filler1b', siteId);
    }
  };

  return (
    <table className="border-collapse" style={{ fontSize: '14px' }}>
      <tbody>
        {/* Medallion icon row - database/vacuum theme */}
        <tr>
          <td className="px-2 py-1 text-center border">
            <div className="flex items-center justify-center">
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-green-600"
              >
                <ellipse 
                  cx="12" 
                  cy="5" 
                  rx="9" 
                  ry="3" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  fill="currentColor"
                />
                <path 
                  d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  fill="none"
                />
                <path 
                  d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>
          </td>
        </tr>
        
        {/* Second row - vacuum_medallion */}
        <tr>
          <td 
            className="px-2 py-1 bg-green-100 text-green-700 text-center border cursor-pointer hover:bg-green-200" 
            onClick={handleMedallionClick}
          >
            vacuum_medallion
          </td>
        </tr>
        
        {/* Third row - filler1a */}
        <tr>
          <td 
            className="px-2 py-1 bg-green-150 text-green-600 text-center border cursor-pointer hover:bg-green-250" 
            onClick={handleFiller1aClick}
          >
            filler1a
          </td>
        </tr>
        
        {/* Fourth row - filler1b */}
        <tr>
          <td 
            className="px-2 py-1 bg-green-200 text-green-600 text-center border cursor-pointer hover:bg-green-300" 
            onClick={handleFiller1bClick}
          >
            filler1b
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default VacuumMedallion;