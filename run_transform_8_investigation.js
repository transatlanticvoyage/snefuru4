#!/usr/bin/env node

// Script to run Transform #8 investigation SQL using Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client with service role for admin queries
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runSQL(query, description) {
  console.log(`\n=== ${description} ===`);
  try {
    const { data, error } = await supabase.rpc('execute_sql', { sql: query });
    if (error) throw error;
    
    console.table(data);
    return data;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🔍 Starting Transform #8 Investigation...');
  
  // Read the SQL file
  const sqlContent = fs.readFileSync('investigate_transform_8_records.sql', 'utf8');
  
  // Split into individual queries (basic split on semicolon + newline)
  const queries = sqlContent
    .split(';\n\n')
    .map(q => q.trim())
    .filter(q => q && !q.startsWith('--') && q.length > 10);
  
  console.log(`Found ${queries.length} queries to execute`);
  
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    if (query.includes('SELECT')) {
      await runSQL(query + ';', `Query ${i + 1}`);
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('\n✅ Investigation complete!');
}

main().catch(console.error);