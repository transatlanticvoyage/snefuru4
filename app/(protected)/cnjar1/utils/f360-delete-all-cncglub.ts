import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function f360DeleteAllCncglub(): Promise<{ success: boolean; message: string; deletedCount?: number }> {
  const supabase = createClientComponentClient();
  
  try {
    console.log('F360: Starting delete all cncglub records...');
    
    // First, get count of records to be deleted
    const { count, error: countError } = await supabase
      .from('cncglub')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      throw new Error(`Failed to count records: ${countError.message}`);
    }
    
    console.log(`F360: About to delete ${count} records...`);
    
    // Delete all records
    const { error: deleteError } = await supabase
      .from('cncglub')
      .delete()
      .neq('cncg_id', 0); // This ensures we delete all records (neq = not equal)
    
    if (deleteError) {
      throw new Error(`Failed to delete records: ${deleteError.message}`);
    }
    
    console.log('F360: Successfully deleted all cncglub records');
    
    return {
      success: true,
      message: `Successfully deleted all ${count} cncglub records!`,
      deletedCount: count || 0
    };
    
  } catch (error) {
    console.error('F360: Error in delete function:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}