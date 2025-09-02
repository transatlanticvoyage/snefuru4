import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting sitesglub migration process...');
    
    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Optional: Add a simple auth check (remove or modify as needed)
    const { migration_key } = await request.json();
    if (migration_key !== 'migrate_sitesglub_2024') {
      return NextResponse.json(
        { success: false, error: 'Invalid migration key' },
        { status: 401 }
      );
    }

    // Step 1: Get all unique domains from sitespren that don't have sitesglub records
    console.log('Step 1: Finding domains that need sitesglub records...');
    
    const { data: missingDomains, error: fetchError } = await supabase
      .from('sitespren')
      .select('sitespren_base')
      .not('sitespren_base', 'is', null)
      .neq('sitespren_base', '');

    if (fetchError) {
      console.error('Error fetching sitespren domains:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch existing domains' },
        { status: 500 }
      );
    }

    // Get unique domains
    const uniqueDomains = [...new Set(missingDomains?.map(record => record.sitespren_base) || [])];
    console.log(`Found ${uniqueDomains.length} unique domains to process`);

    // Step 2: Check which domains already have sitesglub records
    const { data: existingSitesglub, error: existingError } = await supabase
      .from('sitesglub')
      .select('sitesglub_base')
      .in('sitesglub_base', uniqueDomains);

    if (existingError) {
      console.error('Error checking existing sitesglub records:', existingError);
      return NextResponse.json(
        { success: false, error: 'Failed to check existing sitesglub records' },
        { status: 500 }
      );
    }

    const existingDomains = new Set(existingSitesglub?.map(record => record.sitesglub_base) || []);
    const domainsToCreate = uniqueDomains.filter(domain => !existingDomains.has(domain));

    console.log(`${existingDomains.size} domains already have sitesglub records`);
    console.log(`${domainsToCreate.length} domains need new sitesglub records`);

    let createdSitesglubCount = 0;

    // Step 3: Create missing sitesglub records in batches
    if (domainsToCreate.length > 0) {
      console.log('Step 3: Creating missing sitesglub records...');
      
      const batchSize = 100;
      for (let i = 0; i < domainsToCreate.length; i += batchSize) {
        const batch = domainsToCreate.slice(i, i + batchSize);
        const sitesglubRecords = batch.map(domain => ({
          sitesglub_base: domain,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { data: createdRecords, error: insertError } = await supabase
          .from('sitesglub')
          .insert(sitesglubRecords)
          .select('sitesglub_id, sitesglub_base');

        if (insertError) {
          console.error(`Error creating sitesglub batch ${i}:`, insertError);
          return NextResponse.json(
            { success: false, error: `Failed to create sitesglub records at batch ${i}` },
            { status: 500 }
          );
        }

        createdSitesglubCount += createdRecords?.length || 0;
        console.log(`Created batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(domainsToCreate.length/batchSize)}: ${createdRecords?.length} records`);
      }
    }

    // Step 4: Update all sitespren records to link to sitesglub records
    console.log('Step 4: Linking sitespren records to sitesglub records...');
    
    const { data: sitesprenToUpdate, error: sitesprenError } = await supabase
      .from('sitespren')
      .select('id, sitespren_base, fk_sitesglub_id')
      .is('fk_sitesglub_id', null)
      .not('sitespren_base', 'is', null)
      .neq('sitespren_base', '');

    if (sitesprenError) {
      console.error('Error fetching sitespren records to update:', sitesprenError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch sitespren records for linking' },
        { status: 500 }
      );
    }

    console.log(`Found ${sitesprenToUpdate?.length || 0} sitespren records to link`);

    let updatedSitesprenCount = 0;

    if (sitesprenToUpdate && sitesprenToUpdate.length > 0) {
      // Get all sitesglub records to create a lookup map
      const { data: allSitesglub, error: sitesglubError } = await supabase
        .from('sitesglub')
        .select('sitesglub_id, sitesglub_base');

      if (sitesglubError) {
        console.error('Error fetching sitesglub records for lookup:', sitesglubError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch sitesglub records for lookup' },
          { status: 500 }
        );
      }

      // Create lookup map
      const sitesglubLookup = new Map();
      allSitesglub?.forEach(record => {
        sitesglubLookup.set(record.sitesglub_base, record.sitesglub_id);
      });

      // Update sitespren records in batches
      const updateBatchSize = 50;
      for (let i = 0; i < sitesprenToUpdate.length; i += updateBatchSize) {
        const batch = sitesprenToUpdate.slice(i, i + updateBatchSize);
        
        for (const record of batch) {
          const sitesglubId = sitesglubLookup.get(record.sitespren_base);
          if (sitesglubId) {
            const { error: updateError } = await supabase
              .from('sitespren')
              .update({ fk_sitesglub_id: sitesglubId })
              .eq('id', record.id);

            if (updateError) {
              console.error(`Error updating sitespren record ${record.id}:`, updateError);
            } else {
              updatedSitesprenCount++;
            }
          }
        }
        
        console.log(`Updated batch ${Math.floor(i/updateBatchSize) + 1}/${Math.ceil(sitesprenToUpdate.length/updateBatchSize)}`);
      }
    }

    // Step 5: Final verification
    console.log('Step 5: Running final verification...');
    
    const { data: verificationData, error: verifyError } = await supabase
      .from('sitespren')
      .select('id, fk_sitesglub_id')
      .not('sitespren_base', 'is', null)
      .neq('sitespren_base', '');

    if (verifyError) {
      console.error('Error during verification:', verifyError);
    }

    const totalRecords = verificationData?.length || 0;
    const linkedRecords = verificationData?.filter(record => record.fk_sitesglub_id !== null).length || 0;
    const unlinkedRecords = totalRecords - linkedRecords;

    console.log('Migration completed!');

    return NextResponse.json({
      success: true,
      data: {
        uniqueDomainsProcessed: uniqueDomains.length,
        existingSitesglubRecords: existingDomains.size,
        createdSitesglubRecords: createdSitesglubCount,
        updatedSitesprenRecords: updatedSitesprenCount,
        verification: {
          totalSitesprenRecords: totalRecords,
          linkedRecords,
          unlinkedRecords
        }
      },
      message: `Migration completed: Created ${createdSitesglubCount} sitesglub records, linked ${updatedSitesprenCount} sitespren records`
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: 'Migration failed with internal error' },
      { status: 500 }
    );
  }
}