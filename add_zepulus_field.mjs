import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addIsZepulusDocsField() {
  try {
    console.log('🔍 Checking if is_zepulus_docs column exists...');
    
    // Check if column already exists by trying to select it
    const { data: existingData, error: checkError } = await supabase
      .from('filegun_files')
      .select('is_zepulus_docs')
      .limit(1);
    
    if (checkError && checkError.message.includes('column "is_zepulus_docs" does not exist')) {
      console.log('❌ Column does not exist, need to add it');
      console.log('');
      console.log('📋 Run this SQL in your Supabase dashboard (SQL Editor):');
      console.log('');
      console.log('-- Add the column with default value');
      console.log('ALTER TABLE filegun_files ADD COLUMN is_zepulus_docs BOOLEAN DEFAULT false;');
      console.log('');
      console.log('-- Add column comment (this is called a "column comment" in SQL)');
      console.log("COMMENT ON COLUMN filegun_files.is_zepulus_docs IS 'The intended use of this field is to be marked as true for files in Snefuru that are considered documentation files such as read me, etc. and other docs that are considered at least somewhat actively used by the app. The zepulus flag should not necessarily be applied to all documentation files, for example those in hailstorm which could be just planning or iteration files';");
      console.log('');
      
    } else if (!checkError) {
      console.log('✅ Column is_zepulus_docs already exists!');
      console.log('Sample data:', existingData);
    } else {
      console.log('❓ Unexpected error checking column:', checkError.message);
    }
    
  } catch (err) {
    console.error('💥 Error:', err.message);
  }
}

addIsZepulusDocsField();