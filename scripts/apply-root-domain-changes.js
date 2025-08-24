const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://jerylujyofmmjukwlwvn.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcnlsdWp5b2ZtbWp1a3dsd3ZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQyNTE1MCwiZXhwIjoyMDcwMDAxMTUwfQ.09zsgogOOCZeaJ9R6K5D4q2_jzKXFh54f-CNBfwrEQc'
);

async function applyRootDomainChanges() {
  console.log('📝 Applying root domain changes to database...\n');
  
  try {
    // Step 1: Add the column
    console.log('1️⃣ Adding k_root_domain column...');
    const addColumnSQL = `
      ALTER TABLE zhe_serp_results 
      ADD COLUMN IF NOT EXISTS k_root_domain TEXT;
    `;
    
    // Note: Direct SQL execution through Supabase JS client is limited
    // These SQL commands should be run directly in the Supabase SQL editor
    
    console.log('⚠️  IMPORTANT: Please run the following SQL commands in your Supabase SQL editor:\n');
    console.log('=' .repeat(80));
    console.log(addColumnSQL);
    console.log('=' .repeat(80));
    console.log('\n📋 The SQL files have been created at:');
    console.log('   - sql/add_k_root_domain_column.sql');
    console.log('   - sql/create_root_domain_trigger.sql');
    console.log('\n🔧 To apply these changes:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Navigate to the SQL editor');
    console.log('   3. Copy and paste the contents of the SQL files');
    console.log('   4. Execute the SQL commands');
    
    // Step 2: Test that we can update existing records programmatically
    console.log('\n2️⃣ Testing root domain extraction on existing records...');
    
    // Define extraction function inline for this script
    function extractRootDomain(fullDomain) {
      if (!fullDomain) return null;
      
      fullDomain = fullDomain.toLowerCase().trim();
      const parts = fullDomain.split('.');
      
      if (parts.length < 2) return fullDomain;
      
      const multiPartTlds = [
        'co.uk', 'co.nz', 'co.za', 'co.in', 'co.jp', 'co.kr', 'co.th', 'co.id',
        'com.au', 'com.br', 'com.cn', 'com.mx', 'com.tw', 'com.ar', 'com.sg',
        'net.au', 'net.br', 'net.cn', 'net.mx', 'net.tw', 'net.ar', 'net.nz',
        'org.uk', 'org.au', 'org.nz', 'org.br', 'org.cn', 'org.mx', 'org.tw',
        'gov.uk', 'gov.au', 'gov.br', 'gov.cn', 'gov.in', 'gov.sg', 'gov.za',
        'ac.uk', 'ac.nz', 'ac.za', 'ac.jp', 'ac.in', 'ac.kr', 'ac.th',
        'edu.au', 'edu.br', 'edu.cn', 'edu.mx', 'edu.sg', 'edu.tw', 'edu.in'
      ];
      
      if (parts.length >= 3) {
        const possibleTld = parts[parts.length - 2] + '.' + parts[parts.length - 1];
        if (multiPartTlds.includes(possibleTld)) {
          return parts[parts.length - 3] + '.' + possibleTld;
        }
      }
      
      return parts[parts.length - 2] + '.' + parts[parts.length - 1];
    }
    
    // Get a sample of records
    const { data: sampleRecords, error: fetchError } = await supabase
      .from('zhe_serp_results')
      .select('result_id, domain')
      .limit(5);
    
    if (fetchError) throw fetchError;
    
    console.log('\n🧪 Sample root domain extractions:');
    sampleRecords.forEach(record => {
      if (record.domain) {
        const rootDomain = extractRootDomain(record.domain);
        console.log(`   ${record.domain} → ${rootDomain}`);
      }
    });
    
    console.log('\n✅ Root domain extraction logic is ready!');
    console.log('\n📌 Once you\'ve run the SQL commands, the k_root_domain column will be:');
    console.log('   - Automatically populated for new records');
    console.log('   - Updated when the domain field changes');
    console.log('   - Populated for all existing records');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applyRootDomainChanges();