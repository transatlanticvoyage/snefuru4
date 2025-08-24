#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const { createMatchVariations, normalizeText } = require('./city-dfs-matching-analysis.js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://jerylujyofmmjukwlwvn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcnlsdWp5b2ZtbWp1a3dsd3ZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQyNTE1MCwiZXhwIjoyMDcwMDAxMTUwfQ.09zsgogOOCZeaJ9R6K5D4q2_jzKXFh54f-CNBfwrEQc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const BATCH_SIZE = 50;
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE_OVERWRITE = process.argv.includes('--force-overwrite');

// Results tracking
const processingResults = {
  totalProcessed: 0,
  exactMatches: 0,
  multipleMatches: [],
  noMatches: [],
  alreadyMapped: 0,
  updateSuccess: 0,
  updateFailed: 0,
  startTime: Date.now(),
  errors: []
};

async function processCityBatch(cities, dfsLookupMap, batchNumber) {
  console.log(`📦 Processing batch ${batchNumber} (${cities.length} cities)...`);
  
  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    processingResults.totalProcessed++;
    
    // Skip if already has DFS location code (unless force overwrite)
    if (city.fk_dfs_location_code && !FORCE_OVERWRITE) {
      processingResults.alreadyMapped++;
      console.log(`⏭️  [${processingResults.totalProcessed}] ${city.city_name}, ${city.state_full} - Already mapped (${city.fk_dfs_location_code})`);
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
    
    // Process results
    if (foundMatches.length === 0) {
      processingResults.noMatches.push({
        city_id: city.city_id,
        city_name: city.city_name,
        state_full: city.state_full,
        country: city.country,
        variations_tried: variations
      });
      console.log(`❌ [${processingResults.totalProcessed}] ${city.city_name}, ${city.state_full} - No match found`);
    } else if (foundMatches.length === 1) {
      processingResults.exactMatches++;
      const match = foundMatches[0];
      
      console.log(`✅ [${processingResults.totalProcessed}] ${city.city_name}, ${city.state_full} → ${match.location_name} (${match.location_code})`);
      
      // Update database (unless dry run)
      if (!DRY_RUN) {
        try {
          const { error } = await supabase
            .from('cities')
            .update({ fk_dfs_location_code: match.location_code })
            .eq('city_id', city.city_id);
          
          if (error) throw error;
          processingResults.updateSuccess++;
          
        } catch (updateError) {
          processingResults.updateFailed++;
          processingResults.errors.push({
            city_id: city.city_id,
            city_name: city.city_name,
            error: updateError.message
          });
          console.log(`💥 [${processingResults.totalProcessed}] ${city.city_name} - Update failed: ${updateError.message}`);
        }
      }
      
    } else {
      processingResults.multipleMatches.push({
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
      console.log(`⚠️  [${processingResults.totalProcessed}] ${city.city_name}, ${city.state_full} - Multiple matches (${foundMatches.length})`);
    }
    
    // Progress indicator
    if (processingResults.totalProcessed % 10 === 0) {
      const elapsed = (Date.now() - processingResults.startTime) / 1000;
      const rate = processingResults.totalProcessed / elapsed;
      console.log(`📊 Progress: ${processingResults.totalProcessed} cities processed, ${rate.toFixed(1)} cities/sec`);
    }
  }
}

async function processAllCities() {
  try {
    console.log('🚀 CITY-DFS LOCATION MATCHING PROCESSOR');
    console.log('======================================');
    console.log(`Mode: ${DRY_RUN ? '🧪 DRY RUN' : '💾 LIVE UPDATE'}`);
    console.log(`Force overwrite: ${FORCE_OVERWRITE ? '✅ YES' : '❌ NO'}`);
    console.log(`Batch size: ${BATCH_SIZE}\n`);
    
    // Step 1: Get all cities data
    console.log('📊 Fetching cities data...');
    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('city_id, city_name, state_full, country, city_population, fk_dfs_location_code')
      .order('city_population', { ascending: false, nullsLast: true });
    
    if (citiesError) throw citiesError;
    console.log(`✅ Retrieved ${cities.length} cities\n`);
    
    // Step 2: Get DFS locations with City type only
    console.log('🌍 Fetching DFS locations...');
    const { data: dfsLocations, error: dfsError } = await supabase
      .from('dfs_locations')
      .select('location_code, location_name, location_type')
      .eq('location_type', 'City')
      .order('location_name');
    
    if (dfsError) throw dfsError;
    console.log(`✅ Retrieved ${dfsLocations.length} DFS city locations\n`);
    
    // Step 3: Create lookup map
    console.log('🗺️  Creating lookup map...');
    const dfsLookupMap = new Map();
    dfsLocations.forEach(location => {
      const normalizedName = normalizeText(location.location_name);
      if (!dfsLookupMap.has(normalizedName)) {
        dfsLookupMap.set(normalizedName, []);
      }
      dfsLookupMap.get(normalizedName).push(location);
    });
    console.log(`✅ Created lookup map with ${dfsLookupMap.size} entries\n`);
    
    // Step 4: Process cities in batches
    console.log(`🔄 Processing ${cities.length} cities in batches of ${BATCH_SIZE}...\n`);
    
    for (let i = 0; i < cities.length; i += BATCH_SIZE) {
      const batch = cities.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(cities.length / BATCH_SIZE);
      
      console.log(`\n📦 BATCH ${batchNumber}/${totalBatches}`);
      console.log('========================');
      
      await processCityBatch(batch, dfsLookupMap, batchNumber);
      
      // Small delay between batches to avoid overwhelming the database
      if (i + BATCH_SIZE < cities.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Step 5: Generate final report
    const totalTime = Date.now() - processingResults.startTime;
    const successRate = (processingResults.exactMatches / processingResults.totalProcessed) * 100;
    
    console.log('\n\n📈 FINAL PROCESSING REPORT');
    console.log('===========================');
    console.log(`Total cities processed: ${processingResults.totalProcessed}`);
    console.log(`Already mapped (skipped): ${processingResults.alreadyMapped}`);
    console.log(`Exact matches found: ${processingResults.exactMatches}`);
    console.log(`Multiple matches: ${processingResults.multipleMatches.length}`);
    console.log(`No matches: ${processingResults.noMatches.length}`);
    console.log(`Success rate: ${successRate.toFixed(1)}%`);
    console.log(`Processing time: ${(totalTime / 1000).toFixed(1)}s`);
    
    if (!DRY_RUN) {
      console.log(`Database updates succeeded: ${processingResults.updateSuccess}`);
      console.log(`Database updates failed: ${processingResults.updateFailed}`);
    }
    
    // Multiple matches report
    if (processingResults.multipleMatches.length > 0) {
      console.log('\n⚠️  MULTIPLE MATCHES REQUIRING MANUAL REVIEW');
      console.log('===========================================');
      processingResults.multipleMatches.forEach((match, i) => {
        console.log(`${i + 1}. ${match.city_name}, ${match.state_full} (ID: ${match.city_id})`);
        console.log(`   Pattern matched: "${match.matched_pattern}"`);
        console.log('   Possible matches:');
        match.matches_found.forEach((m, j) => {
          console.log(`     ${j + 1}. ${m.location_name} (${m.location_code})`);
        });
        console.log('');
      });
    }
    
    // No matches report
    if (processingResults.noMatches.length > 0) {
      console.log('\n❌ CITIES WITH NO MATCHES FOUND');
      console.log('================================');
      processingResults.noMatches.slice(0, 20).forEach((nomatch, i) => {
        console.log(`${i + 1}. ${nomatch.city_name}, ${nomatch.state_full} (ID: ${nomatch.city_id})`);
        console.log(`   Tried: ${nomatch.variations_tried.slice(0, 2).join(' | ')}`);
        console.log('');
      });
      
      if (processingResults.noMatches.length > 20) {
        console.log(`... and ${processingResults.noMatches.length - 20} more`);
      }
    }
    
    // Errors report
    if (processingResults.errors.length > 0) {
      console.log('\n💥 DATABASE UPDATE ERRORS');
      console.log('=========================');
      processingResults.errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error.city_name} (ID: ${error.city_id})`);
        console.log(`   Error: ${error.error}`);
        console.log('');
      });
    }
    
    // Final recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('=================');
    
    if (DRY_RUN) {
      if (successRate > 90) {
        console.log('✅ Excellent results! Run without --dry-run to apply updates.');
      } else {
        console.log('⚠️  Consider reviewing results before applying updates.');
      }
    } else {
      if (processingResults.updateFailed === 0) {
        console.log('✅ All database updates completed successfully!');
      } else {
        console.log(`⚠️  ${processingResults.updateFailed} updates failed. Review errors above.`);
      }
    }
    
    if (processingResults.multipleMatches.length > 0) {
      console.log(`⚠️  Manual review needed for ${processingResults.multipleMatches.length} cities with multiple matches.`);
    }
    
    return processingResults;
    
  } catch (error) {
    console.error('💥 Processing failed:', error);
    throw error;
  }
}

// Run the processor
if (require.main === module) {
  processAllCities()
    .then((results) => {
      console.log('\n✅ Processing completed successfully!');
      if (results.multipleMatches.length > 0 || results.noMatches.length > 0) {
        console.log('⚠️  Some cities require manual attention (see report above).');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Processing failed:', error.message);
      process.exit(1);
    });
}

module.exports = { processAllCities };