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
      console.log(`❌ [${processingResults.totalProcessed}] ${city.city_name}, ${city.state_full} - No match found`);\n    } else if (foundMatches.length === 1) {\n      processingResults.exactMatches++;\n      const match = foundMatches[0];\n      \n      console.log(`✅ [${processingResults.totalProcessed}] ${city.city_name}, ${city.state_full} → ${match.location_name} (${match.location_code})`);\n      \n      // Update database (unless dry run)\n      if (!DRY_RUN) {\n        try {\n          const { error } = await supabase\n            .from('cities')\n            .update({ fk_dfs_location_code: match.location_code })\n            .eq('city_id', city.city_id);\n          \n          if (error) throw error;\n          processingResults.updateSuccess++;\n          \n        } catch (updateError) {\n          processingResults.updateFailed++;\n          processingResults.errors.push({\n            city_id: city.city_id,\n            city_name: city.city_name,\n            error: updateError.message\n          });\n          console.log(`💥 [${processingResults.totalProcessed}] ${city.city_name} - Update failed: ${updateError.message}`);\n        }\n      }\n      \n    } else {\n      processingResults.multipleMatches.push({\n        city_id: city.city_id,\n        city_name: city.city_name,\n        state_full: city.state_full,\n        country: city.country,\n        matched_pattern: matchedPattern,\n        matches_found: foundMatches.map(m => ({\n          location_code: m.location_code,\n          location_name: m.location_name\n        }))\n      });\n      console.log(`⚠️  [${processingResults.totalProcessed}] ${city.city_name}, ${city.state_full} - Multiple matches (${foundMatches.length})`);\n    }\n    \n    // Progress indicator\n    if (processingResults.totalProcessed % 10 === 0) {\n      const elapsed = (Date.now() - processingResults.startTime) / 1000;\n      const rate = processingResults.totalProcessed / elapsed;\n      console.log(`📊 Progress: ${processingResults.totalProcessed} cities processed, ${rate.toFixed(1)} cities/sec`);\n    }\n  }\n}\n\nasync function processAllCities() {\n  try {\n    console.log('🚀 CITY-DFS LOCATION MATCHING PROCESSOR');\n    console.log('======================================');\n    console.log(`Mode: ${DRY_RUN ? '🧪 DRY RUN' : '💾 LIVE UPDATE'}`);\n    console.log(`Force overwrite: ${FORCE_OVERWRITE ? '✅ YES' : '❌ NO'}`);\n    console.log(`Batch size: ${BATCH_SIZE}\\n`);\n    \n    // Step 1: Get all cities data\n    console.log('📊 Fetching cities data...');\n    const { data: cities, error: citiesError } = await supabase\n      .from('cities')\n      .select('city_id, city_name, state_full, country, city_population, fk_dfs_location_code')\n      .order('city_population', { ascending: false, nullsLast: true });\n    \n    if (citiesError) throw citiesError;\n    console.log(`✅ Retrieved ${cities.length} cities\\n`);\n    \n    // Step 2: Get DFS locations with City type only\n    console.log('🌍 Fetching DFS locations...');\n    const { data: dfsLocations, error: dfsError } = await supabase\n      .from('dfs_locations')\n      .select('location_code, location_name, location_type')\n      .eq('location_type', 'City')\n      .order('location_name');\n    \n    if (dfsError) throw dfsError;\n    console.log(`✅ Retrieved ${dfsLocations.length} DFS city locations\\n`);\n    \n    // Step 3: Create lookup map\n    console.log('🗺️  Creating lookup map...');\n    const dfsLookupMap = new Map();\n    dfsLocations.forEach(location => {\n      const normalizedName = normalizeText(location.location_name);\n      if (!dfsLookupMap.has(normalizedName)) {\n        dfsLookupMap.set(normalizedName, []);\n      }\n      dfsLookupMap.get(normalizedName).push(location);\n    });\n    console.log(`✅ Created lookup map with ${dfsLookupMap.size} entries\\n`);\n    \n    // Step 4: Process cities in batches\n    console.log(`🔄 Processing ${cities.length} cities in batches of ${BATCH_SIZE}...\\n`);\n    \n    for (let i = 0; i < cities.length; i += BATCH_SIZE) {\n      const batch = cities.slice(i, i + BATCH_SIZE);\n      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;\n      const totalBatches = Math.ceil(cities.length / BATCH_SIZE);\n      \n      console.log(`\\n📦 BATCH ${batchNumber}/${totalBatches}`);\n      console.log('========================');\n      \n      await processCityBatch(batch, dfsLookupMap, batchNumber);\n      \n      // Small delay between batches to avoid overwhelming the database\n      if (i + BATCH_SIZE < cities.length) {\n        await new Promise(resolve => setTimeout(resolve, 500));\n      }\n    }\n    \n    // Step 5: Generate final report\n    const totalTime = Date.now() - processingResults.startTime;\n    const successRate = (processingResults.exactMatches / processingResults.totalProcessed) * 100;\n    \n    console.log('\\n\\n📈 FINAL PROCESSING REPORT');\n    console.log('===========================');\n    console.log(`Total cities processed: ${processingResults.totalProcessed}`);\n    console.log(`Already mapped (skipped): ${processingResults.alreadyMapped}`);\n    console.log(`Exact matches found: ${processingResults.exactMatches}`);\n    console.log(`Multiple matches: ${processingResults.multipleMatches.length}`);\n    console.log(`No matches: ${processingResults.noMatches.length}`);\n    console.log(`Success rate: ${successRate.toFixed(1)}%`);\n    console.log(`Processing time: ${(totalTime / 1000).toFixed(1)}s`);\n    \n    if (!DRY_RUN) {\n      console.log(`Database updates succeeded: ${processingResults.updateSuccess}`);\n      console.log(`Database updates failed: ${processingResults.updateFailed}`);\n    }\n    \n    // Multiple matches report\n    if (processingResults.multipleMatches.length > 0) {\n      console.log('\\n⚠️  MULTIPLE MATCHES REQUIRING MANUAL REVIEW');\n      console.log('===========================================');\n      processingResults.multipleMatches.forEach((match, i) => {\n        console.log(`${i + 1}. ${match.city_name}, ${match.state_full} (ID: ${match.city_id})`);\n        console.log(`   Pattern matched: \"${match.matched_pattern}\"`);\n        console.log('   Possible matches:');\n        match.matches_found.forEach((m, j) => {\n          console.log(`     ${j + 1}. ${m.location_name} (${m.location_code})`);\n        });\n        console.log('');\n      });\n    }\n    \n    // No matches report\n    if (processingResults.noMatches.length > 0) {\n      console.log('\\n❌ CITIES WITH NO MATCHES FOUND');\n      console.log('================================');\n      processingResults.noMatches.slice(0, 20).forEach((nomatch, i) => {\n        console.log(`${i + 1}. ${nomatch.city_name}, ${nomatch.state_full} (ID: ${nomatch.city_id})`);\n        console.log(`   Tried: ${nomatch.variations_tried.slice(0, 2).join(' | ')}`);\n        console.log('');\n      });\n      \n      if (processingResults.noMatches.length > 20) {\n        console.log(`... and ${processingResults.noMatches.length - 20} more`);\n      }\n    }\n    \n    // Errors report\n    if (processingResults.errors.length > 0) {\n      console.log('\\n💥 DATABASE UPDATE ERRORS');\n      console.log('=========================');\n      processingResults.errors.forEach((error, i) => {\n        console.log(`${i + 1}. ${error.city_name} (ID: ${error.city_id})`);\n        console.log(`   Error: ${error.error}`);\n        console.log('');\n      });\n    }\n    \n    // Final recommendations\n    console.log('\\n💡 RECOMMENDATIONS');\n    console.log('=================');\n    \n    if (DRY_RUN) {\n      if (successRate > 90) {\n        console.log('✅ Excellent results! Run without --dry-run to apply updates.');\n      } else {\n        console.log('⚠️  Consider reviewing results before applying updates.');\n      }\n    } else {\n      if (processingResults.updateFailed === 0) {\n        console.log('✅ All database updates completed successfully!');\n      } else {\n        console.log(`⚠️  ${processingResults.updateFailed} updates failed. Review errors above.`);\n      }\n    }\n    \n    if (processingResults.multipleMatches.length > 0) {\n      console.log(`⚠️  Manual review needed for ${processingResults.multipleMatches.length} cities with multiple matches.`);\n    }\n    \n    return processingResults;\n    \n  } catch (error) {\n    console.error('💥 Processing failed:', error);\n    throw error;\n  }\n}\n\n// Manual resolution helper\nfunction showUsage() {\n  console.log('\\n📖 USAGE');\n  console.log('=========');\n  console.log('node city-dfs-matching-processor.js [options]');\n  console.log('');\n  console.log('Options:');\n  console.log('  --dry-run           Run analysis without updating database');\n  console.log('  --force-overwrite   Overwrite existing fk_dfs_location_code values');\n  console.log('');\n  console.log('Examples:');\n  console.log('  node city-dfs-matching-processor.js --dry-run');\n  console.log('  node city-dfs-matching-processor.js');\n  console.log('  node city-dfs-matching-processor.js --force-overwrite');\n}\n\n// Run the processor\nif (require.main === module) {\n  if (process.argv.includes('--help') || process.argv.includes('-h')) {\n    showUsage();\n    process.exit(0);\n  }\n  \n  processAllCities()\n    .then((results) => {\n      console.log('\\n✅ Processing completed successfully!');\n      if (results.multipleMatches.length > 0 || results.noMatches.length > 0) {\n        console.log('⚠️  Some cities require manual attention (see report above).');\n      }\n      process.exit(0);\n    })\n    .catch((error) => {\n      console.error('\\n💥 Processing failed:', error.message);\n      process.exit(1);\n    });\n}\n\nmodule.exports = { processAllCities };