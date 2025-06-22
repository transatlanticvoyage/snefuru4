'use client';

import { useTierColors } from '@/app/hooks/useTierColors';

interface CDLTHTSProps {
  visibleColumns: string[];
  stickyColumnCount: number;
  tier2Content?: string[]; // For nwpi_content fields
  tier3Content?: string[]; // For gcon_pieces fields  
  pageType: 'nwjar1' | 'gconjar1';
}

// Mapping from nwpi_content fields to their gcon_pieces equivalents
const nwpiToGconMapping: Record<string, string> = {
  'post_title': 'meta_title',
  'post_content': 'corpus1',
  'post_excerpt': 'corpus2',
  'fk_sitespren_base': 'asn_sitespren_base',
  'post_id': 'asn_nwpi_posts_id',
  'post_name': 'pageslug',
  'a_elementor_substance': 'pelementor_cached',
  'post_date': 'date_time_pub_carry',
  'post_status': 'pub_status',
  'i_sync_completed_at': 'created_at'
};

export default function ContentDataLineageTableHeaderTierSystem1({
  visibleColumns,
  stickyColumnCount,
  tier2Content = [],
  tier3Content = [],
  pageType
}: CDLTHTSProps) {
  const { tierColors, loading } = useTierColors();

  if (loading) {
    return null; // Don't render until colors are loaded
  }

  const renderTierRow = (
    tierNumber: 1 | 2 | 3 | 4,
    tierLabel: string,
    content: string[] = []
  ) => {
    const bgColor = tierColors[`dltier${tierNumber}_bgcolor` as keyof typeof tierColors];
    
    return (
      <tr style={{ backgroundColor: bgColor }}>
        {visibleColumns.map((col, index) => {
          const isSticky = index < stickyColumnCount;
          const isSeparator = index === stickyColumnCount - 1 && stickyColumnCount > 0;
          
          return (
            <th
              key={`tier${tierNumber}-${col}`}
              className={`text-left text-xs text-gray-700 lowercase tracking-wider px-6 py-2 ${
                isSticky ? 'sticky z-10' : ''
              } ${isSeparator ? 'border-r-4 border-black' : ''}`}
              style={{ 
                backgroundColor: bgColor,
                ...(isSticky ? { left: `${index * 150}px` } : {})
              }}
            >
              {col === 'actions' || col === 'select' ? (
                <div className="flex flex-col">
                  <div className="font-normal text-xs">{tierLabel}</div>
                </div>
              ) : (tierNumber === 1 || tierNumber === 4) ? (
                // Tier 1 and 4 (wp phpmyadmin) - leave blank
                <div></div>
              ) : tierNumber === 2 ? (
                // Tier 2 - nwpi_content
                pageType === 'nwjar1' ? (
                  <div className="flex flex-col">
                    <div className="font-normal text-xs">nwpi_content</div>
                    <div className="font-bold">{content[index] || ''}</div>
                  </div>
                ) : (
                  // On gconjar1, show the mapped nwpi_content field
                  <div className="flex flex-col">
                    <div className="font-normal text-xs">nwpi_content</div>
                    <div className="font-bold">
                      {Object.keys(nwpiToGconMapping).find(key => 
                        nwpiToGconMapping[key] === col
                      ) || ''}
                    </div>
                  </div>
                )
              ) : (
                // Tier 3 - gcon_pieces
                pageType === 'gconjar1' ? (
                  <div className="flex flex-col">
                    <div className="font-normal text-xs">gcon_pieces</div>
                    <div className="font-bold">{col}</div>
                  </div>
                ) : (
                  // On nwjar1, show the gcon_pieces equivalent
                  <div className="flex flex-col">
                    <div className="font-normal text-xs">gcon_pieces</div>
                    <div className="font-bold">
                      {nwpiToGconMapping[col] || ''}
                    </div>
                  </div>
                )
              )}
            </th>
          );
        })}
      </tr>
    );
  };

  return (
    <>
      {renderTierRow(1, 'tier1 - wp phpmyadmin')}
      {renderTierRow(2, 'tier2 - nwpi_content', tier2Content)}
      {renderTierRow(3, 'tier3 - gcon_pieces', tier3Content)}
      {renderTierRow(4, 'tier4 - wp phpmyadmin')}
      
      {/* Horizontal separator */}
      <tr>
        <td colSpan={visibleColumns.length} className="p-0">
          <div className="h-1 bg-black"></div>
        </td>
      </tr>
    </>
  );
}