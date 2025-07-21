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

  // Render both classic and enhanced shendo bars with pluto classes applied directly
  return (
    <>
      <FavaCTCShendoClassic
        category={selectedCategory}
        categoryData={categoryData}
        activeTemplateId={activeTemplateId}
        onTemplateSelect={onTemplateSelect}
        plutoClasses={getChamberClasses(plutoSettings, 'ctc_shendo_classic', 'shendo-classic-chamber')}
      />
      
      <FavaCTCShendoEnhanced
        category={selectedCategory}
        categoryData={categoryData}
        activeTemplateId={activeTemplateId}
        onTemplateSelect={onTemplateSelect}
        plutoClasses={getChamberClasses(plutoSettings, 'ctc_shendo_enhanced', 'shendo-enhanced-chamber')}
      />
    </>
  );
}