import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// URL cleaning function (reused from f71_createsite)
function cleanUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, '')  // Remove http:// or https://
    .replace(/^www\./, '')        // Remove www.
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the request body
    const { sites_data, user_internal_id } = await request.json();

    if (!sites_data || !Array.isArray(sites_data) || sites_data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sites data array is required' },
        { status: 400 }
      );
    }

    if (!user_internal_id) {
      return NextResponse.json(
        { success: false, error: 'User internal ID is required' },
        { status: 400 }
      );
    }

    console.log('Processing bulk site updates for user:', user_internal_id);
    console.log('Processing', sites_data.length, 'sites');

    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    // Get all host accounts with company data for this user
    const { data: hostAccounts, error: hostAccountsError } = await supabase
      .from('host_account')
      .select(`
        id,
        username,
        host_company:fk_host_company_id (
          name
        )
      `)
      .eq('fk_user_id', user_internal_id) as {
        data: Array<{
          id: string;
          username: string | null;
          host_company: {
            name: string | null;
          } | null;
        }> | null;
        error: any;
      };

    if (hostAccountsError) {
      console.error('Error fetching host accounts:', hostAccountsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch host account data' },
        { status: 500 }
      );
    }

    // Process each row of data
    for (let i = 0; i < sites_data.length; i++) {
      const row = sites_data[i];
      const [siteBase, companyName, username] = row;

      // Skip empty rows
      if (!siteBase || siteBase.trim() === '') {
        continue;
      }

      try {
        // Clean the URL
        const cleanedUrl = cleanUrl(siteBase.trim());
        
        if (!cleanedUrl) {
          errors.push(`Row ${i + 1}: Invalid URL "${siteBase}"`);
          continue;
        }

        // Find matching host account if company name and username are provided
        let hostAccountId = null;
        if (companyName && companyName.trim() && username && username.trim()) {
          const matchingAccount = hostAccounts?.find(account => 
            account.host_company?.name?.toLowerCase() === companyName.trim().toLowerCase() &&
            account.username?.toLowerCase() === username.trim().toLowerCase()
          );
          
          if (matchingAccount) {
            hostAccountId = matchingAccount.id;
          } else {
            console.log(`Row ${i + 1}: No matching host account found for ${companyName} - ${username}`);
          }
        }

        // Check if site already exists for this user
        const { data: existingSite, error: checkError } = await supabase
          .from('sitespren')
          .select('id, fk_domreg_hostaccount')
          .eq('sitespren_base', cleanedUrl)
          .eq('fk_users_id', user_internal_id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error(`Error checking existing site for ${cleanedUrl}:`, checkError);
          errors.push(`Row ${i + 1}: Database error checking site "${cleanedUrl}"`);
          continue;
        }

        if (existingSite) {
          // Site exists - update the host account association
          const { error: updateError } = await supabase
            .from('sitespren')
            .update({
              fk_domreg_hostaccount: hostAccountId,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingSite.id);

          if (updateError) {
            console.error(`Error updating site ${cleanedUrl}:`, updateError);
            errors.push(`Row ${i + 1}: Failed to update site "${cleanedUrl}"`);
          } else {
            updatedCount++;
            console.log(`Updated existing site: ${cleanedUrl}`);
          }
        } else {
          // Site doesn't exist - create new site
          const { error: createError } = await supabase
            .from('sitespren')
            .insert({
              sitespren_base: cleanedUrl,
              fk_users_id: user_internal_id,
              fk_domreg_hostaccount: hostAccountId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (createError) {
            console.error(`Error creating site ${cleanedUrl}:`, createError);
            errors.push(`Row ${i + 1}: Failed to create site "${cleanedUrl}"`);
          } else {
            createdCount++;
            console.log(`Created new site: ${cleanedUrl}`);
          }
        }

      } catch (rowError) {
        console.error(`Error processing row ${i + 1}:`, rowError);
        errors.push(`Row ${i + 1}: Unexpected error processing "${siteBase}"`);
      }
    }

    console.log(`Bulk update completed: ${createdCount} created, ${updatedCount} updated, ${errors.length} errors`);

    // Return results
    const response: {
      success: boolean;
      data: {
        created: number;
        updated: number;
        errors: number;
        errorDetails?: string[];
      };
      message: string;
    } = {
      success: true,
      data: {
        created: createdCount,
        updated: updatedCount,
        errors: errors.length
      },
      message: `Processing completed: ${createdCount} sites created, ${updatedCount} sites updated`
    };

    if (errors.length > 0) {
      response.data.errorDetails = errors;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('f19_updatesites API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}