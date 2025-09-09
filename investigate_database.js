const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with admin credentials
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateTermiteRemovalPage() {
  try {
    console.log('🔍 Starting database investigation for termite-removal-2 page...\n');

    // Query for the specific page
    const { data: gconPieces, error } = await supabase
      .from('gcon_pieces')
      .select('*')
      .eq('post_name', 'termite-removal-2')
      .ilike('asn_sitespren_base', '%tuscaloosapestcontrol.net%');

    if (error) {
      console.error('❌ Error querying database:', error);
      return;
    }

    if (!gconPieces || gconPieces.length === 0) {
      console.log('❌ No records found for termite-removal-2 with tuscaloosapestcontrol.net');
      
      // Try broader search
      console.log('\n🔄 Trying broader search...');
      const { data: broadSearch, error: broadError } = await supabase
        .from('gcon_pieces')
        .select('id, post_name, asn_sitespren_base, meta_title')
        .eq('post_name', 'termite-removal-2');

      if (!broadError && broadSearch && broadSearch.length > 0) {
        console.log('📋 Found termite-removal-2 pages on other domains:');
        broadSearch.forEach(piece => {
          console.log(`  - ID: ${piece.id}, Domain: ${piece.asn_sitespren_base}, Title: ${piece.meta_title}`);
        });
      }
      return;
    }

    console.log(`✅ Found ${gconPieces.length} matching record(s)\n`);

    for (const piece of gconPieces) {
      console.log('=' .repeat(80));
      console.log(`📄 ANALYZING RECORD: ${piece.meta_title}`);
      console.log('=' .repeat(80));
      console.log(`ID: ${piece.id}`);
      console.log(`Domain: ${piece.asn_sitespren_base}`);
      console.log(`Post Name: ${piece.post_name}`);
      console.log(`URL: ${piece.asn_sitespren_base}/${piece.post_name}/`);
      console.log(`Created: ${piece.created_at}`);
      console.log(`Updated: ${piece.updated_at}`);
      console.log();

      // Check pelementor_cached data
      console.log('🎨 ELEMENTOR DATA ANALYSIS (pelementor_cached):');
      console.log('-'.repeat(50));
      
      if (piece.pelementor_cached) {
        const elementorDataStr = typeof piece.pelementor_cached === 'string' 
          ? piece.pelementor_cached 
          : JSON.stringify(piece.pelementor_cached);
        
        console.log(`Data Size: ${elementorDataStr.length} characters`);
        
        // Try to parse and find images
        let elementorData;
        try {
          elementorData = typeof piece.pelementor_cached === 'string' 
            ? JSON.parse(piece.pelementor_cached)
            : piece.pelementor_cached;
            
          // Extract image URLs from Elementor data
          const imageUrls = extractImageUrls(elementorData);
          console.log(`Images found in Elementor data: ${imageUrls.length}`);
          imageUrls.forEach((url, index) => {
            console.log(`  ${index + 1}. ${url}`);
          });
        } catch (parseError) {
          console.log('⚠️  Could not parse Elementor data as JSON');
          console.log(`Data preview: ${elementorDataStr.substring(0, 200)}...`);
        }
      } else {
        console.log('❌ No Elementor data found');
      }

      console.log();

      // Check discovered_images_regolith data
      console.log('🖼️  REGOLITH DISCOVERY ANALYSIS (discovered_images_regolith):');
      console.log('-'.repeat(50));
      
      if (piece.discovered_images_regolith) {
        const regolith = piece.discovered_images_regolith;
        console.log(`Discovery Timestamp: ${regolith.discovery_timestamp || 'N/A'}`);
        console.log(`Total Images Found: ${regolith.total_images_found || 0}`);
        console.log(`Elementor Data Size: ${regolith.elementor_data_size || 'N/A'}`);
        
        if (regolith.discovered_images && regolith.discovered_images.length > 0) {
          console.log('\nDiscovered Images:');
          regolith.discovered_images.forEach((img, index) => {
            console.log(`  ${index + 1}. URL: ${img.url}`);
            console.log(`     Type: ${img.source_type}`);
            console.log(`     Context: ${img.element_context.element_type} ${img.element_context.widget_type ? `(${img.element_context.widget_type})` : ''}`);
            console.log(`     Path: ${img.element_context.settings_path}`);
            console.log();
          });
        }

        if (regolith.images_by_source_type) {
          console.log('Images by Source Type:');
          Object.entries(regolith.images_by_source_type).forEach(([type, count]) => {
            console.log(`  - ${type}: ${count}`);
          });
        }

        if (regolith.images_by_element_type) {
          console.log('\nImages by Element Type:');
          Object.entries(regolith.images_by_element_type).forEach(([type, count]) => {
            console.log(`  - ${type}: ${count}`);
          });
        }
      } else {
        console.log('❌ No regolith discovery data found');
      }

      console.log();

      // Check for recent updates
      console.log('📅 RECENT UPDATE ANALYSIS:');
      console.log('-'.repeat(30));
      const updatedDate = new Date(piece.updated_at);
      const now = new Date();
      const hoursSinceUpdate = (now - updatedDate) / (1000 * 60 * 60);
      console.log(`Last updated: ${hoursSinceUpdate.toFixed(1)} hours ago`);
      
      if (hoursSinceUpdate < 24) {
        console.log('🟢 Updated within last 24 hours');
      } else if (hoursSinceUpdate < 168) {
        console.log('🟡 Updated within last week');
      } else {
        console.log('🔴 Updated more than a week ago');
      }

      console.log('\n');
    }

    console.log('✅ Investigation complete!');

  } catch (error) {
    console.error('🚨 Investigation failed:', error);
  }
}

// Helper function to recursively extract image URLs from Elementor data
function extractImageUrls(data, urls = new Set()) {
  if (!data || typeof data !== 'object') {
    return Array.from(urls);
  }

  if (Array.isArray(data)) {
    data.forEach(item => extractImageUrls(item, urls));
    return Array.from(urls);
  }

  // Common image fields
  const imageFields = ['image', 'background_image', 'bg_image', 'icon_image', 'logo', 'gallery', 'slider_images', 'carousel_images', 'hero_image', 'featured_image', 'thumbnail', 'banner_image', 'media'];

  // Check direct fields
  for (const field of imageFields) {
    if (data[field]) {
      const value = data[field];
      if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('//'))) {
        urls.add(value);
      } else if (typeof value === 'object' && value.url) {
        urls.add(value.url);
      } else if (Array.isArray(value)) {
        value.forEach(item => {
          if (typeof item === 'string' && (item.startsWith('http') || item.startsWith('//'))) {
            urls.add(item);
          } else if (typeof item === 'object' && item.url) {
            urls.add(item.url);
          }
        });
      }
    }
  }

  // Check settings
  if (data.settings) {
    extractImageUrls(data.settings, urls);
  }

  // Recursively check nested structures
  Object.values(data).forEach(value => {
    if (typeof value === 'object' && value !== null) {
      extractImageUrls(value, urls);
    }
  });

  return Array.from(urls);
}

// Run the investigation
investigateTermiteRemovalPage();