import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, sitesprenBase } = body;

    // Validate input
    if (!siteId) {
      return NextResponse.json(
        { success: false, message: 'Site ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'User record not found' },
        { status: 404 }
      );
    }

    // Get site record from sitespren table to get connection details
    const { data: siteData, error: siteError } = await supabase
      .from('sitespren')
      .select('*')
      .eq('id', siteId)
      .eq('fk_users_id', userData.id)
      .single();

    if (siteError || !siteData) {
      return NextResponse.json(
        { success: false, message: 'Site not found or access denied' },
        { status: 404 }
      );
    }

    // Perform WordPress vacuum operation
    const vacuumResult = await performWordPressVacuum(siteData);
    
    if (vacuumResult.success) {
      // Store the vacuumed data in sitespren_vacuums table
      const saveResult = await saveVacuumDataToSupabase(
        vacuumResult.data, 
        siteData, 
        userData.id, 
        supabase
      );
      
      if (saveResult.success) {
        return NextResponse.json({
          success: true,
          message: `Successfully vacuumed WordPress data and stored ${saveResult.recordCount} fields`,
          recordCount: saveResult.recordCount,
          data: {
            fields_vacuumed: saveResult.recordCount,
            source_site: siteData.sitespren_base,
            vacuum_timestamp: new Date().toISOString()
          }
        });
      } else {
        return NextResponse.json({
          success: false,
          message: `WordPress vacuum successful but failed to save to database: ${saveResult.message}`
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({
        success: false,
        message: `WordPress vacuum failed: ${vacuumResult.message}`
      }, { status: 500 });
    }

  } catch (error) {
    console.error('WordPress vacuum API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

// Perform WordPress vacuum operation via Plugin API
async function performWordPressVacuum(siteData: any) {
  try {
    // Construct WordPress site URL
    let siteUrl = siteData.sitespren_base;
    if (!siteUrl.startsWith('http')) {
      siteUrl = 'https://' + siteUrl;
    }
    
    const endpoint = `${siteUrl}/wp-json/snefuru/v1/zen-sitespren-vacuum`;
    console.log(`🔄 Attempting WordPress vacuum for ${siteUrl}`);
    console.log(`🔗 Vacuum API endpoint: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${siteData.api_key || ''}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Snefuru-NextJS-App/1.0'
      },
    });

    console.log(`📡 WordPress vacuum response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`❌ WordPress vacuum error response: ${responseText}`);
      throw new Error(`WordPress vacuum request failed: ${response.status} ${response.statusText}. Response: ${responseText}`);
    }

    const data = await response.json();
    console.log(`📊 WordPress vacuum response data:`, { 
      success: data.success, 
      recordCount: data.record_count, 
      message: data.message
    });
    
    if (!data.success) {
      throw new Error(`WordPress vacuum failed: ${data.message}`);
    }
    
    return {
      success: true,
      data: data.data || [],
      recordCount: data.record_count || 0,
      message: data.message
    };
    
  } catch (error) {
    console.error('WordPress vacuum error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      data: []
    };
  }
}

// Save vacuum data to sitespren_vacuums table in Supabase
async function saveVacuumDataToSupabase(
  vacuumData: any[], 
  siteData: any, 
  userId: string, 
  supabase: any
) {
  try {
    if (!vacuumData || vacuumData.length === 0) {
      return {
        success: false,
        message: 'No data to save',
        recordCount: 0
      };
    }
    
    // We expect only one record from zen_sitespren table typically
    const wpData = vacuumData[0];
    
    // Check if vacuum record already exists for this site
    const { data: existingVacuum, error: checkError } = await supabase
      .from('sitespren_vacuums')
      .select('vacuum_id')
      .eq('fk_sitespren_id', siteData.id)
      .eq('fk_users_id', userId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing vacuum:', checkError);
      return {
        success: false,
        message: `Error checking existing vacuum: ${checkError.message}`,
        recordCount: 0
      };
    }
    
    // Prepare the vacuum data for insertion/update
    const vacuumRecord = {
      fk_sitespren_id: siteData.id,
      fk_users_id: userId,
      // Copy all fields from WordPress zen_sitespren data
      ...wpData,
      // Override/ensure certain fields
      updated_at: new Date().toISOString()
    };
    
    // Remove fields that shouldn't be copied or might cause conflicts
    delete vacuumRecord.vacuum_id; // Let Supabase auto-generate
    delete vacuumRecord.id; // This is the WordPress record ID, not the vacuum ID
    
    if (existingVacuum) {
      // Update existing vacuum record
      const { error: updateError } = await supabase
        .from('sitespren_vacuums')
        .update(vacuumRecord)
        .eq('vacuum_id', existingVacuum.vacuum_id);
      
      if (updateError) {
        console.error('Error updating vacuum record:', updateError);
        return {
          success: false,
          message: `Error updating vacuum record: ${updateError.message}`,
          recordCount: 0
        };
      }
      
      console.log('✅ Updated existing vacuum record');
    } else {
      // Insert new vacuum record
      const { error: insertError } = await supabase
        .from('sitespren_vacuums')
        .insert([vacuumRecord]);
      
      if (insertError) {
        console.error('Error inserting vacuum record:', insertError);
        return {
          success: false,
          message: `Error inserting vacuum record: ${insertError.message}`,
          recordCount: 0
        };
      }
      
      console.log('✅ Inserted new vacuum record');
    }
    
    // Count the number of non-null fields that were saved
    const fieldCount = Object.keys(vacuumRecord).filter(key => 
      vacuumRecord[key] !== null && vacuumRecord[key] !== undefined && vacuumRecord[key] !== ''
    ).length;
    
    return {
      success: true,
      message: 'Vacuum data saved successfully',
      recordCount: fieldCount
    };
    
  } catch (error) {
    console.error('Error saving vacuum data:', error);
    return {
      success: false,
      message: `Error saving vacuum data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      recordCount: 0
    };
  }
}