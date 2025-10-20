import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { queryType, description, ...params } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });
    
    console.log(`🔍 Running: ${description}`);
    
    let result;
    let error;
    
    switch (queryType) {
      case 'release_3_null_count':
        ({ data: result, error } = await supabase
          .from('leadsmart_transformed')
          .select('*', { count: 'exact' })
          .eq('jrel_release_id', 3)
          .is('baobab_attempt_id', null));
        break;
        
      case 'existing_attempt_8_count':
        ({ data: result, error } = await supabase
          .from('leadsmart_transformed')
          .select('*', { count: 'exact' })
          .eq('baobab_attempt_id', 8));
        break;
        
      case 'total_release_3_count':
        ({ data: result, error } = await supabase
          .from('leadsmart_transformed')
          .select('*', { count: 'exact' })
          .eq('jrel_release_id', 3));
        break;
        
      case 'sample_release_3_nulls':
        ({ data: result, error } = await supabase
          .from('leadsmart_transformed')
          .select('mundial_id, city_name, state_code, created_at, updated_at, baobab_attempt_id')
          .eq('jrel_release_id', 3)
          .is('baobab_attempt_id', null)
          .order('created_at', { ascending: false })
          .limit(20));
        break;
        
      case 'time_window_records':
        const { startTime, endTime } = params;
        ({ data: result, error } = await supabase
          .from('leadsmart_transformed')
          .select('*', { count: 'exact' })
          .or(`created_at.gte.${startTime},created_at.lte.${endTime},updated_at.gte.${startTime},updated_at.lte.${endTime}`));
        break;
        
      case 'release_3_sample':
        ({ data: result, error } = await supabase
          .from('leadsmart_transformed')
          .select('mundial_id, city_name, state_code, created_at, updated_at, baobab_attempt_id, jrel_release_id')
          .eq('jrel_release_id', 3)
          .order('created_at', { ascending: false })
          .limit(50));
        break;
        
      case 'attempt_48_transformed_count':
        ({ data: result, error } = await supabase
          .from('leadsmart_transformed')
          .select('*', { count: 'exact' })
          .eq('baobab_attempt_id', 48));
        break;
        
      case 'attempt_48_relations_count':
        ({ data: result, error } = await supabase
          .from('leadsmart_transformed_relations')
          .select('*', { count: 'exact' })
          .eq('baobab_attempt_id', 48));
        break;
        
      case 'attempt_48_sample':
        ({ data: result, error } = await supabase
          .from('leadsmart_transformed')
          .select('mundial_id, city_name, state_code, jrel_release_id, created_at, updated_at, baobab_attempt_id')
          .eq('baobab_attempt_id', 48)
          .order('created_at', { ascending: false })
          .limit(10));
        break;
        
      case 'check_zip_codes_format':
        ({ data: result, error } = await supabase
          .from('leadsmart_transformed')
          .select('mundial_id, city_name, state_code, aggregated_zip_codes')
          .not('aggregated_zip_codes', 'is', null)
          .order('created_at', { ascending: false })
          .limit(5));
        break;
        
      default:
        return NextResponse.json({ 
          success: false,
          error: 'Unknown query type',
          description
        }, { status: 400 });
    }
    
    if (error) {
      return NextResponse.json({ 
        success: false,
        error: error.message,
        description
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      description,
      data: result,
      count: result?.length || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}