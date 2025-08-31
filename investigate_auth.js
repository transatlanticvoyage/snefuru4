const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateAuth() {
  console.log('=== AUTHENTICATION INVESTIGATION ===\n');
  
  const currentUserId = '122be854-0adb-46fc-bb04-12c9e73714ba';
  const expectedUserId = 'a8febfdb-1fba-4f2a-b8ac-da4b4a2ddc64';
  
  // Check if current user exists in auth.users (if we have access)
  console.log('1. Checking current logged-in user in public.users table:');
  const { data: currentUser, error: currentError } = await supabase
    .from('users')
    .select('*')
    .eq('id', currentUserId)
    .single();
    
  if (currentError) {
    console.log('❌ Current user NOT found in public.users table');
    console.log('Error:', currentError.message);
  } else {
    console.log('✅ Current user found:', currentUser);
  }
  
  console.log('\n2. Checking expected user in public.users table:');
  const { data: expectedUser, error: expectedError } = await supabase
    .from('users')
    .select('*')
    .eq('id', expectedUserId)
    .single();
    
  if (expectedError) {
    console.log('❌ Expected user NOT found in public.users table');
    console.log('Error:', expectedError.message);
  } else {
    console.log('✅ Expected user found:', expectedUser);
  }
  
  console.log('\n3. All users in public.users table:');
  const { data: allUsers, error: allError } = await supabase
    .from('users')
    .select('id, email, is_admin, created_at');
    
  if (allError) {
    console.log('❌ Error fetching all users:', allError.message);
  } else {
    console.log('All users in public.users:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Is Admin: ${user.is_admin}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });
  }
  
  console.log('\n4. Checking for email matches:');
  const { data: emailMatches, error: emailError } = await supabase
    .from('users')
    .select('*')
    .ilike('email', '%snef2%');
    
  if (emailError) {
    console.log('❌ Error checking email matches:', emailError.message);
  } else {
    console.log('Users with snef2 in email:', emailMatches);
  }
}

investigateAuth();