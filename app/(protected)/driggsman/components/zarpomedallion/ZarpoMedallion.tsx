'use client';

import React from 'react';

interface ZarpoMedallionProps {
  siteId: string;
  onMedallionClick?: (medallionType: string, siteId: string) => void;
  onFiller1aClick?: (actionType: string, siteId: string) => void;
  onFiller1bClick?: (actionType: string, siteId: string) => void;
}

const ZarpoMedallion: React.FC<ZarpoMedallionProps> = ({
  siteId,
  onMedallionClick,
  onFiller1aClick,
  onFiller1bClick
}) => {

  const handleMedallionClick = () => {
    if (onMedallionClick) {
      onMedallionClick('zarpo_medallion', siteId);
    } else {
      console.log('zarpo_medallion', siteId);
    }
  };

  const handleFiller1aClick = () => {
    if (onFiller1aClick) {
      onFiller1aClick('zarpo-filler1a', siteId);
    } else {
      console.log('zarpo-filler1a', siteId);
    }
  };

  const handleFiller1bClick = () => {
    if (onFiller1bClick) {
      onFiller1bClick('zarpo-filler1b', siteId);
    } else {
      console.log('zarpo-filler1b', siteId);
    }
  };

  return (
    <table className="border-collapse" style={{ fontSize: '14px' }}>
      <tbody>
        {/* Medallion icon row - web scraper/spider theme */}
        <tr>
          <td className="px-2 py-1 text-center border">
            <div className="flex items-center justify-center">
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-blue-600"
              >
                <circle 
                  cx="12" 
                  cy="12" 
                  r="3" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  fill="currentColor"
                />
                <path 
                  d="M12 3v6M12 15v6M3 12h6M15 12h6M6.34 6.34l4.24 4.24M13.42 13.42l4.24 4.24M6.34 17.66l4.24-4.24M13.42 10.58l4.24-4.24" 
                  stroke="currentColor" 
                  strokeWidth="2"
                />
              </svg>
            </div>
          </td>
        </tr>
        
        {/* Second row - zarpo_medallion */}
        <tr>
          <td 
            className="px-2 py-1 bg-blue-100 text-blue-700 text-center border cursor-pointer hover:bg-blue-200" 
            onClick={handleMedallionClick}
          >
            zarpo_medallion
          </td>
        </tr>
        
        {/* Third row - filler1a */}
        <tr>
          <td 
            className="px-2 py-1 bg-blue-150 text-blue-600 text-center border cursor-pointer hover:bg-blue-250" 
            onClick={handleFiller1aClick}
          >
            filler1a
          </td>
        </tr>
        
        {/* Fourth row - filler1b */}
        <tr>
          <td 
            className="px-2 py-1 bg-blue-200 text-blue-600 text-center border cursor-pointer hover:bg-blue-300" 
            onClick={handleFiller1bClick}
          >
            filler1b
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default ZarpoMedallion;