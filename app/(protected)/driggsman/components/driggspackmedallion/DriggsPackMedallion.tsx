'use client';

import React from 'react';

interface DriggsPackMedallionProps {
  driggspackNumber: number;
  siteId: string;
  onZzClick: (event: React.MouseEvent<HTMLTableCellElement>, zzType: string, siteId: string) => void;
  onMiddleClick?: (driggspackType: string, siteId: string) => void;
  onBottomClick?: (driggspackType: string, siteId: string) => void;
}

const DriggsPackMedallion: React.FC<DriggsPackMedallionProps> = ({
  driggspackNumber,
  siteId,
  onZzClick,
  onMiddleClick,
  onBottomClick
}) => {
  // Define the content for each row based on the driggspack number
  const getZzText = () => `zz${driggspackNumber}`;
  
  const getMiddleText = () => {
    switch (driggspackNumber) {
      case 1: return 'full1 (for ref)';
      case 2: return 'for citations';
      case 3: return 'for chat with ai';
      default: return `middle${driggspackNumber}`;
    }
  };
  
  const getBottomText = () => `driggspack${driggspackNumber}`;

  const handleMiddleClick = () => {
    if (onMiddleClick) {
      onMiddleClick(`driggspack${driggspackNumber}-middle`, siteId);
    } else {
      console.log(`driggspack${driggspackNumber}-middle`, siteId);
    }
  };

  const handleBottomClick = () => {
    if (onBottomClick) {
      onBottomClick(`driggspack${driggspackNumber}`, siteId);
    } else {
      console.log(`driggspack${driggspackNumber}`, siteId);
    }
  };

  return (
    <table className="border-collapse" style={{ fontSize: '14px' }}>
      <tbody>
        {/* Top row - zz1/zz2/zz3 */}
        <tr>
          <td 
            className="px-2 py-1 bg-gray-100 text-gray-600 text-center border cursor-pointer hover:bg-gray-200" 
            onClick={(e) => onZzClick(e, getZzText(), siteId)}
          >
            {getZzText()}
          </td>
        </tr>
        
        {/* Middle row - contextual text */}
        <tr>
          <td 
            className="px-2 py-1 bg-gray-150 text-gray-600 text-center border cursor-pointer hover:bg-gray-250" 
            onClick={handleMiddleClick}
          >
            {getMiddleText()}
          </td>
        </tr>
        
        {/* Bottom row - driggspack text */}
        <tr>
          <td 
            className="px-2 py-1 bg-gray-200 text-gray-600 text-center border cursor-pointer hover:bg-gray-300" 
            onClick={handleBottomClick}
          >
            {getBottomText()}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default DriggsPackMedallion;