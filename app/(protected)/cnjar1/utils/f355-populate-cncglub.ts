import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface City {
  city_id: number;
  city_name: string | null;
  state_code: string | null;
}

interface Industry {
  industry_id: number;
  industry_name: string | null;
}

interface CncglubCombo {
  rel_city_id: number;
  rel_industry_id: number;
}

export async function f355PopulateCncglub(): Promise<{ success: boolean; message: string; stats?: { cities: number; industries: number; existingCombos: number; newCombos: number; totalPossible: number } }> {
  const supabase = createClientComponentClient();
  
  try {
    console.log('F355: Starting populate cncglub function...');
    
    // Step 1: Fetch all cities
    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('city_id, city_name, state_code');
    
    if (citiesError) {
      throw new Error(`Failed to fetch cities: ${citiesError.message}`);
    }
    
    if (!cities || cities.length === 0) {
      return { success: false, message: 'No cities found in database' };
    }
    
    console.log(`F355: Found ${cities.length} cities`);
    
    // Step 2: Fetch all industries
    const { data: industries, error: industriesError } = await supabase
      .from('industries')
      .select('industry_id, industry_name');
    
    if (industriesError) {
      throw new Error(`Failed to fetch industries: ${industriesError.message}`);
    }
    
    if (!industries || industries.length === 0) {
      return { success: false, message: 'No industries found in database' };
    }
    
    console.log(`F355: Found ${industries.length} industries`);
    
    // Step 3: Fetch existing combinations
    const { data: existingCombos, error: existingError } = await supabase
      .from('cncglub')
      .select('rel_city_id, rel_industry_id');
    
    if (existingError) {
      throw new Error(`Failed to fetch existing combinations: ${existingError.message}`);
    }
    
    console.log(`F355: Found ${existingCombos?.length || 0} existing combinations`);
    
    // Step 4: Create a Set of existing combinations for fast lookup
    const existingSet = new Set(
      (existingCombos || []).map(combo => `${combo.rel_city_id}-${combo.rel_industry_id}`)
    );
    
    // Step 5: Generate all possible combinations and filter out existing ones
    const newCombinations: CncglubCombo[] = [];
    const totalPossible = cities.length * industries.length;
    
    for (const city of cities) {
      for (const industry of industries) {
        const comboKey = `${city.city_id}-${industry.industry_id}`;
        if (!existingSet.has(comboKey)) {
          newCombinations.push({
            rel_city_id: city.city_id,
            rel_industry_id: industry.industry_id
          });
        }
      }
    }
    
    console.log(`F355: Need to create ${newCombinations.length} new combinations out of ${totalPossible} total possible`);
    
    if (newCombinations.length === 0) {
      return {
        success: true,
        message: 'All possible city-industry combinations already exist!',
        stats: {
          cities: cities.length,
          industries: industries.length,
          existingCombos: existingCombos?.length || 0,
          newCombos: 0,
          totalPossible
        }
      };
    }
    
    // Step 6: Insert new combinations in batches to avoid timeout
    const batchSize = 1000;
    let insertedCount = 0;
    
    for (let i = 0; i < newCombinations.length; i += batchSize) {
      const batch = newCombinations.slice(i, i + batchSize);
      
      console.log(`F355: Inserting batch ${Math.floor(i / batchSize) + 1} (${batch.length} records)...`);
      
      const { error: insertError } = await supabase
        .from('cncglub')
        .insert(batch);
      
      if (insertError) {
        throw new Error(`Failed to insert batch starting at index ${i}: ${insertError.message}`);
      }
      
      insertedCount += batch.length;
      console.log(`F355: Successfully inserted ${insertedCount}/${newCombinations.length} combinations`);
    }
    
    console.log('F355: Populate function completed successfully');
    
    return {
      success: true,
      message: `Successfully created ${insertedCount} new city-industry combinations!`,
      stats: {
        cities: cities.length,
        industries: industries.length,
        existingCombos: existingCombos?.length || 0,
        newCombos: insertedCount,
        totalPossible
      }
    };
    
  } catch (error) {
    console.error('F355: Error in populate function:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}