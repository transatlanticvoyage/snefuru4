#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://jerylujyofmmjukwlwvn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcnlsdWp5b2ZtbWp1a3dsd3ZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQyNTE1MCwiZXhwIjoyMDcwMDAxMTUwfQ.09zsgogOOCZeaJ9R6K5D4q2_jzKXFh54f-CNBfwrEQc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper functions for text normalization
const normalizeText = (text) => {
  if (!text) return '';
  return text.toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s,-]/g, '');
};

const createMatchVariations = (city, state, country) => {
  const variations = [];
  const cityNorm = normalizeText(city);
  const stateNorm = normalizeText(state);
  const countryNorm = normalizeText(country);
  
  // DFS format: "Los Angeles,California,United States" (exact match)
  variations.push(`${cityNorm},${stateNorm},${countryNorm}`);
  
  // With USA instead of United States
  if (countryNorm === 'united states') {
    variations.push(`${cityNorm},${stateNorm},usa`);
  }
  
  // Try with common state abbreviation mappings
  const stateAbbreviations = {
    'alabama': 'al', 'alaska': 'ak', 'arizona': 'az', 'arkansas': 'ar',
    'california': 'ca', 'colorado': 'co', 'connecticut': 'ct', 'delaware': 'de',
    'florida': 'fl', 'georgia': 'ga', 'hawaii': 'hi', 'idaho': 'id',
    'illinois': 'il', 'indiana': 'in', 'iowa': 'ia', 'kansas': 'ks',
    'kentucky': 'ky', 'louisiana': 'la', 'maine': 'me', 'maryland': 'md',
    'massachusetts': 'ma', 'michigan': 'mi', 'minnesota': 'mn', 'mississippi': 'ms',
    'missouri': 'mo', 'montana': 'mt', 'nebraska': 'ne', 'nevada': 'nv',
    'new hampshire': 'nh', 'new jersey': 'nj', 'new mexico': 'nm', 'new york': 'ny',
    'north carolina': 'nc', 'north dakota': 'nd', 'ohio': 'oh', 'oklahoma': 'ok',
    'oregon': 'or', 'pennsylvania': 'pa', 'rhode island': 'ri', 'south carolina': 'sc',
    'south dakota': 'sd', 'tennessee': 'tn', 'texas': 'tx', 'utah': 'ut',
    'vermont': 'vt', 'virginia': 'va', 'washington': 'wa', 'west virginia': 'wv',
    'wisconsin': 'wi', 'wyoming': 'wy'
  };
  
  const stateAbbr = stateAbbreviations[stateNorm];
  if (stateAbbr) {
    variations.push(`${cityNorm},${stateAbbr},${countryNorm}`);
    if (countryNorm === 'united states') {
      variations.push(`${cityNorm},${stateAbbr},usa`);
    }
  }
  
  return [...new Set(variations)]; // Remove duplicates
};

async function analyzeCityMatching() {
  try {
    console.log('🔍 CITY-DFS LOCATION MATCHING ANALYSIS');
    console.log('=====================================\n');
    
    const startTime = Date.now();
    
    // Step 1: Get sample of cities data
    console.log('📊 Fetching cities data...');
    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('city_id, city_name, state_full, country, city_population, fk_dfs_location_code')
      .order('city_population', { ascending: false, nullsLast: true })
      .limit(1000);
    
    if (citiesError) throw citiesError;
    
    console.log(`✅ Retrieved ${cities.length} cities`);
    
    // Step 2: Get DFS locations with city type only
    console.log('🌍 Fetching DFS locations (City type only)...');
    const { data: dfsLocations, error: dfsError } = await supabase
      .from('dfs_locations')
      .select('location_code, location_name, location_type')
      .eq('location_type', 'City')
      .order('location_name');
    
    if (dfsError) throw dfsError;
    
    console.log(`✅ Retrieved ${dfsLocations.length} DFS city locations\n`);
    
    // Step 3: Create lookup map for DFS locations
    const dfsLookupMap = new Map();
    dfsLocations.forEach(location => {
      const normalizedName = normalizeText(location.location_name);
      if (!dfsLookupMap.has(normalizedName)) {
        dfsLookupMap.set(normalizedName, []);
      }
      dfsLookupMap.get(normalizedName).push(location);
    });
    
    console.log(`🗺️  Created lookup map with ${dfsLookupMap.size} unique normalized location names\n`);
    
    // Step 4: Analysis results tracking
    const analysisResults = {
      totalCities: cities.length,
      alreadyMapped: 0,
      exactMatches: [],
      multipleMatches: [],
      noMatches: [],
      patternBreakdown: {
        exactFormat: 0,
        withSpaces: 0,
        withoutCountry: 0,
        withUSA: 0,
        noMatch: 0
      }
    };
    
    console.log('🔍 Starting matching analysis...\n');
    
    // Step 5: Process each city
    for (let i = 0; i < Math.min(50, cities.length); i++) { // Start with first 50 for analysis
      const city = cities[i];
      
      // Skip if already has DFS location code
      if (city.fk_dfs_location_code) {
        analysisResults.alreadyMapped++;
        continue;
      }
      
      const variations = createMatchVariations(city.city_name, city.state_full, city.country);
      let foundMatches = [];
      let matchedPattern = null;
      
      // Try each variation
      for (const variation of variations) {
        const matches = dfsLookupMap.get(variation) || [];
        if (matches.length > 0) {
          foundMatches = matches;
          matchedPattern = variation;
          break;
        }
      }
      
      // Categorize results
      if (foundMatches.length === 0) {
        analysisResults.noMatches.push({
          city_id: city.city_id,
          city_name: city.city_name,
          state_full: city.state_full,
          country: city.country,
          variations_tried: variations
        });
        analysisResults.patternBreakdown.noMatch++;
      } else if (foundMatches.length === 1) {
        analysisResults.exactMatches.push({
          city_id: city.city_id,
          city_name: city.city_name,
          state_full: city.state_full,
          country: city.country,
          matched_pattern: matchedPattern,
          dfs_location_code: foundMatches[0].location_code,
          dfs_location_name: foundMatches[0].location_name
        });
        
        // Track which pattern worked
        if (matchedPattern.includes(', ')) {
          analysisResults.patternBreakdown.withSpaces++;
        } else if (matchedPattern.includes('usa')) {
          analysisResults.patternBreakdown.withUSA++;
        } else if (!matchedPattern.includes(city.country.toLowerCase())) {
          analysisResults.patternBreakdown.withoutCountry++;
        } else {
          analysisResults.patternBreakdown.exactFormat++;
        }
      } else {
        analysisResults.multipleMatches.push({
          city_id: city.city_id,
          city_name: city.city_name,
          state_full: city.state_full,
          country: city.country,
          matched_pattern: matchedPattern,
          matches_found: foundMatches.map(m => ({
            location_code: m.location_code,
            location_name: m.location_name
          }))
        });
      }
      
      // Progress indicator
      if ((i + 1) % 10 === 0) {
        process.stdout.write(`Processed ${i + 1}/${Math.min(50, cities.length)} cities...\r`);
      }
    }
    
    console.log(`\n\nProcessed ${Math.min(50, cities.length)} cities for analysis\n`);
    
    // Step 6: Display results
    const totalTime = Date.now() - startTime;
    
    console.log('📈 ANALYSIS RESULTS');
    console.log('==================');
    console.log(`Total cities analyzed: ${Math.min(50, cities.length)}`);
    console.log(`Already mapped: ${analysisResults.alreadyMapped}`);
    console.log(`Exact matches (1:1): ${analysisResults.exactMatches.length}`);
    console.log(`Multiple matches (manual review needed): ${analysisResults.multipleMatches.length}`);
    console.log(`No matches found: ${analysisResults.noMatches.length}`);
    console.log(`Processing time: ${(totalTime / 1000).toFixed(1)}s\n`);
    
    console.log('🎯 PATTERN SUCCESS BREAKDOWN');
    console.log('============================');
    Object.entries(analysisResults.patternBreakdown).forEach(([pattern, count]) => {
      console.log(`${pattern}: ${count}`);
    });
    console.log('');
    
    // Step 7: Show sample exact matches
    if (analysisResults.exactMatches.length > 0) {
      console.log('✅ SAMPLE EXACT MATCHES (First 10)');
      console.log('==================================');
      analysisResults.exactMatches.slice(0, 10).forEach((match, i) => {
        console.log(`${i + 1}. ${match.city_name}, ${match.state_full}`);
        console.log(`   → DFS: ${match.dfs_location_name} (${match.dfs_location_code})`);
        console.log(`   → Pattern: "${match.matched_pattern}"`);
        console.log('');
      });
    }
    
    // Step 8: Show multiple matches (need manual review)
    if (analysisResults.multipleMatches.length > 0) {
      console.log('⚠️  MULTIPLE MATCHES (MANUAL REVIEW NEEDED)');
      console.log('==========================================');
      analysisResults.multipleMatches.forEach((match, i) => {
        console.log(`${i + 1}. ${match.city_name}, ${match.state_full}`);
        console.log(`   Pattern: "${match.matched_pattern}"`);
        console.log('   Found matches:');
        match.matches_found.forEach((m, j) => {
          console.log(`     ${j + 1}. ${m.location_name} (${m.location_code})`);
        });
        console.log('');
      });
    }
    
    // Step 9: Show no matches (need investigation)
    if (analysisResults.noMatches.length > 0) {
      console.log('❌ NO MATCHES FOUND (First 10)');
      console.log('==============================');
      analysisResults.noMatches.slice(0, 10).forEach((nomatch, i) => {
        console.log(`${i + 1}. ${nomatch.city_name}, ${nomatch.state_full}, ${nomatch.country}`);
        console.log(`   Tried variations: ${nomatch.variations_tried.slice(0, 3).join(' | ')}`);
        console.log('');
      });
    }
    
    // Step 10: Recommendations
    console.log('💡 RECOMMENDATIONS');
    console.log('==================');
    const successRate = (analysisResults.exactMatches.length / (Math.min(50, cities.length) - analysisResults.alreadyMapped)) * 100;
    console.log(`Current success rate: ${successRate.toFixed(1)}%`);
    
    if (successRate > 80) {
      console.log('✅ High success rate! Ready for full processing.');
    } else if (successRate > 60) {
      console.log('⚠️  Moderate success rate. Consider refining matching patterns.');
    } else {
      console.log('❌ Low success rate. Need to investigate data formats.');
    }
    
    if (analysisResults.multipleMatches.length > 0) {
      console.log(`⚠️  ${analysisResults.multipleMatches.length} cities have multiple matches and need manual review.`);
    }
    
    console.log('\n🔄 Next steps:');
    console.log('1. Review multiple matches above');
    console.log('2. Investigate no-match cases');
    console.log('3. Run full processing script if satisfied with results');
    
    return analysisResults;
    
  } catch (error) {
    console.error('💥 Analysis failed:', error);
    throw error;
  }
}

// Run the analysis
if (require.main === module) {
  analyzeCityMatching()
    .then(() => {
      console.log('\n✅ Analysis completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Analysis failed:', error.message);
      process.exit(1);
    });
}

module.exports = { analyzeCityMatching, createMatchVariations, normalizeText };