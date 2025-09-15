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
        // Create detailed success message
        let message = `Successfully vacuumed WordPress data and stored ${saveResult.recordCount} fields`;
        if (saveResult.details?.skippedFields?.length > 0) {
          message += `. Note: ${saveResult.details.skippedFields.length} fields were skipped due to schema differences (${saveResult.details.skippedFields.slice(0, 3).join(', ')}${saveResult.details.skippedFields.length > 3 ? '...' : ''})`;
        }
        
        return NextResponse.json({
          success: true,
          message: message,
          recordCount: saveResult.recordCount,
          data: {
            fields_saved: saveResult.recordCount,
            fields_skipped: saveResult.details?.skippedFields?.length || 0,
            source_site: siteData.sitespren_base,
            vacuum_timestamp: new Date().toISOString(),
            operation: saveResult.details?.operation || 'unknown',
            skipped_fields: saveResult.details?.skippedFields || []
          }
        });
      } else {
        // Even if save failed, show what would have been skipped for troubleshooting
        let message = `WordPress vacuum successful but failed to save to database: ${saveResult.message}`;
        if (saveResult.details?.skippedFields?.length > 0) {
          message += `. Schema issues detected: ${saveResult.details.skippedFields.length} fields would be skipped (${saveResult.details.skippedFields.slice(0, 3).join(', ')}${saveResult.details.skippedFields.length > 3 ? '...' : ''})`;
        }
        
        return NextResponse.json({
          success: false,
          message: message,
          data: {
            fields_that_would_be_saved: saveResult.details?.savedFields?.length || 0,
            fields_that_would_be_skipped: saveResult.details?.skippedFields?.length || 0,
            skipped_fields: saveResult.details?.skippedFields || []
          }
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
        recordCount: 0,
        details: { savedFields: [], skippedFields: [] }
      };
    }
    
    // We expect only one record from zen_sitespren table typically
    const wpData = vacuumData[0];
    
    // Get the schema for sitespren_vacuums table to filter fields
    const schemaResult = await getSupabaseTableSchema(supabase, 'sitespren_vacuums');
    if (!schemaResult.success) {
      console.error('Failed to get table schema:', schemaResult.message);
      return {
        success: false,
        message: `Failed to get table schema: ${schemaResult.message}`,
        recordCount: 0,
        details: { savedFields: [], skippedFields: [] }
      };
    }
    
    const validColumns = schemaResult.columns;
    console.log('Valid sitespren_vacuums columns:', validColumns);
    
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
        recordCount: 0,
        details: { savedFields: [], skippedFields: [] }
      };
    }
    
    // Filter WordPress data to only include fields that exist in Supabase table
    const filteredData = filterDataBySchema(wpData, validColumns);
    
    // Prepare the vacuum data for insertion/update
    const vacuumRecord = {
      fk_sitespren_id: siteData.id,
      fk_users_id: userId,
      // Only copy fields that exist in the Supabase table
      ...filteredData.validFields,
      // Override/ensure certain fields
      updated_at: new Date().toISOString()
    };
    
    console.log('Filtered vacuum record:', {
      totalWpFields: Object.keys(wpData).length,
      validFields: filteredData.savedFields.length,
      skippedFields: filteredData.skippedFields.length,
      skippedFieldNames: filteredData.skippedFields
    });
    
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
          recordCount: 0,
          details: { savedFields: filteredData.savedFields, skippedFields: filteredData.skippedFields }
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
          recordCount: 0,
          details: { savedFields: filteredData.savedFields, skippedFields: filteredData.skippedFields }
        };
      }
      
      console.log('✅ Inserted new vacuum record');
    }
    
    // Create detailed success message
    let message = `Vacuum data saved successfully. ${filteredData.savedFields.length} fields saved`;
    if (filteredData.skippedFields.length > 0) {
      message += `, ${filteredData.skippedFields.length} fields skipped due to schema differences`;
    }
    
    return {
      success: true,
      message: message,
      recordCount: filteredData.savedFields.length,
      details: {
        savedFields: filteredData.savedFields,
        skippedFields: filteredData.skippedFields,
        operation: existingVacuum ? 'updated' : 'inserted'
      }
    };
    
  } catch (error) {
    console.error('Error saving vacuum data:', error);
    return {
      success: false,
      message: `Error saving vacuum data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      recordCount: 0,
      details: { savedFields: [], skippedFields: [] }
    };
  }
}

// Get Supabase table schema by querying the table structure
async function getSupabaseTableSchema(supabase: any, tableName: string) {
  try {
    // Try to get table schema by doing a minimal select to see what columns exist
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      // If the error is about no rows, that's fine - we just want the column structure
      if (error.code !== 'PGRST116') {
        console.error('Schema query error:', error);
        return {
          success: false,
          message: `Failed to query table schema: ${error.message}`,
          columns: []
        };
      }
    }
    
    // Get column names from the query metadata
    // Since we can't directly access Supabase schema in the client,
    // we'll use a predefined list of known columns for sitespren_vacuums
    const knownColumns = [
      'vacuum_id', 'fk_sitespren_id', 'fk_users_id', 'created_at', 'updated_at',
      'sitespren_base', 'true_root_domain', 'full_subdomain', 'webproperty_type',
      'wpuser1', 'wppass1', 'wp_plugin_installed1', 'wp_plugin_connected2',
      'fk_domreg_hostaccount', 'is_wp_site', 'wp_rest_app_pass',
      'driggs_industry', 'driggs_city', 'driggs_brand_name', 'driggs_site_type_purpose',
      'driggs_email_1', 'driggs_address_full', 'driggs_address_species_id',
      'driggs_phone_1', 'driggs_phone1_platform_id', 'driggs_cgig_id',
      'driggs_citations_done', 'driggs_social_profiles_done',
      'driggs_special_note_for_ai_tool', 'driggs_hours', 'driggs_owner_name',
      'driggs_short_descr', 'driggs_long_descr'
    ];
    
    return {
      success: true,
      message: 'Schema retrieved successfully',
      columns: knownColumns
    };
    
  } catch (error) {
    console.error('Error getting table schema:', error);
    return {
      success: false,
      message: `Error getting table schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
      columns: []
    };
  }
}

// Filter WordPress data to only include fields that exist in Supabase table
function filterDataBySchema(wpData: any, validColumns: string[]) {
  const validFields: any = {};
  const savedFields: string[] = [];
  const skippedFields: string[] = [];
  
  // Go through each field in WordPress data
  for (const [key, value] of Object.entries(wpData)) {
    if (validColumns.includes(key)) {
      // Field exists in Supabase schema
      validFields[key] = value;
      savedFields.push(key);
    } else {
      // Field doesn't exist in Supabase schema
      skippedFields.push(key);
      console.log(`⚠️ Skipping field '${key}' - not found in sitespren_vacuums schema`);
    }
  }
  
  console.log(`Schema filtering: ${savedFields.length} fields will be saved, ${skippedFields.length} fields skipped`);
  
  return {
    validFields,
    savedFields,
    skippedFields
  };
}