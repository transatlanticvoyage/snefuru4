import { useState, useEffect } from 'react';
import { CTCShendoProps, ColtempData } from './favaCTCTypes';
import { CTCEventListener } from './favaCTCEvents';
import FavaCTCShendoClassic from './favaCTCShendoClassic';
import FavaCTCShendoEnhanced from './favaCTCShendoEnhanced';
import { usePlutoSettings, getChamberClasses } from '../../hooks/usePlutoSettings';

export default function FavaCTCShendoActive({
  category,
  templates,
  activeTemplateId,
  onTemplateSelect,
  utg_id
}: CTCShendoProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<ColtempData[]>([]);
  
  // Get pluto settings for chamber control
  const plutoSettings = usePlutoSettings(utg_id);

  useEffect(() => {
    // Listen for shendo events
    const unsubscribe = CTCEventListener.onShendoShowCategory(({ category, utg_id: eventUtgId }) => {
      if (eventUtgId === utg_id) {
        setSelectedCategory(category);
        setCategoryData(templates[category] || []);
      }
    });

    return unsubscribe;
  }, [templates, utg_id]);

  // Render both classic and enhanced shendo bars with independent chamber control
  return (
    <>
      <div 
        className={getChamberClasses(plutoSettings, 'ctc_shendo_classic', 'shendo-classic-chamber')}
        data-debug-utg-id={utg_id}
        data-debug-visible={plutoSettings.ctc_shendo_classic}
        style={{
          border: '2px solid darkgreen',
          padding: '5px',
          margin: '5px 0'
        }}
      >
        <div style={{ background: 'palegreen', padding: '5px', marginBottom: '5px' }}>
          DEBUG: Shendo Classic Chamber - Should be {plutoSettings.ctc_shendo_classic ? 'VISIBLE' : 'HIDDEN'}
        </div>
        <FavaCTCShendoClassic
          category={selectedCategory}
          categoryData={categoryData}
          activeTemplateId={activeTemplateId}
          onTemplateSelect={onTemplateSelect}
        />
      </div>
      
      <div 
        className={getChamberClasses(plutoSettings, 'ctc_shendo_enhanced', 'shendo-enhanced-chamber')}
        data-debug-utg-id={utg_id}
        data-debug-visible={plutoSettings.ctc_shendo_enhanced}
        style={{
          border: '2px solid green',
          padding: '5px',
          margin: '5px 0'
        }}
      >
        <div style={{ background: 'lightgreen', padding: '5px', marginBottom: '5px' }}>
          DEBUG: Shendo Enhanced Chamber - Should be {plutoSettings.ctc_shendo_enhanced ? 'VISIBLE' : 'HIDDEN'}
        </div>
        <FavaCTCShendoEnhanced
          category={selectedCategory}
          categoryData={categoryData}
          activeTemplateId={activeTemplateId}
          onTemplateSelect={onTemplateSelect}
        />
      </div>
    </>
  );
}