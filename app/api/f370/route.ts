import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  // Add timeout protection - kill process after 10 minutes
  const timeoutId = setTimeout(() => {
    console.error('F370 process timed out after 10 minutes');
    throw new Error('F370 process timed out');
  }, 10 * 60 * 1000);

  try {
    const body = await request.json();
    const {
      country,
      industry_id,
      city_population_filter,
      kwslot,
      kw_rubric,
      rel_dfs_location_code,
      language_code,
      tag_name,
      user_internal_id
    } = body;

    // Step 1: Filter cncglub rows based on criteria
    if (!user_internal_id) {
      return NextResponse.json({ error: 'User internal ID is required' }, { status: 400 });
    }

    console.log('F370 Filters applied:', {
      country,
      industry_id,
      city_population_filter,
      kwslot,
      kw_rubric,
      rel_dfs_location_code,
      language_code,
      tag_name,
      user_internal_id
    });

    let cncglubQuery = supabase
      .from('cncglub')
      .select(`
        cncg_id,
        rel_city_id,
        rel_industry_id,
        cities:rel_city_id (
          city_id,
          city_name,
          state_code,
          state_full,
          country,
          city_population
        ),
        industries:rel_industry_id (
          industry_id,
          industry_name
        )
      `)
      .limit(50000);

    console.log('Base query set up, applying filters...');

    // Apply country filter
    if (country && country !== '') {
      console.log(`Applying country filter: ${country}`);
      cncglubQuery = cncglubQuery.ilike('cities.country', country);
    }

    // Apply industry filter
    if (industry_id && industry_id !== '') {
      console.log(`Applying industry filter: ${industry_id}`);
      cncglubQuery = cncglubQuery.eq('rel_industry_id', parseInt(industry_id));
    }

    // Apply city population filter
    if (city_population_filter && city_population_filter !== 'all') {
      console.log(`Applying city population filter: ${city_population_filter}`);
      switch (city_population_filter) {
        case 'under-25k':
          cncglubQuery = cncglubQuery.not('cities.city_population', 'is', null).lt('cities.city_population', 25000);
          break;
        case '25k-50k':
          cncglubQuery = cncglubQuery.not('cities.city_population', 'is', null).gte('cities.city_population', 25000).lt('cities.city_population', 50000);
          break;
        case '50k-100k':
          cncglubQuery = cncglubQuery.not('cities.city_population', 'is', null).gte('cities.city_population', 50000).lt('cities.city_population', 100000);
          break;
        case '75k-325k':
          cncglubQuery = cncglubQuery.not('cities.city_population', 'is', null).gte('cities.city_population', 75000).lt('cities.city_population', 325000);
          break;
        case '100k-500k':
          cncglubQuery = cncglubQuery.not('cities.city_population', 'is', null).gte('cities.city_population', 100000).lt('cities.city_population', 500000);
          break;
        case '500k-plus':
          cncglubQuery = cncglubQuery.not('cities.city_population', 'is', null).gte('cities.city_population', 500000);
          break;
      }
    }

    console.log('Executing cncglub query...');
    const { data: cncglubRows, error: cncglubError } = await cncglubQuery;

    if (cncglubError) {
      console.error('Error fetching cncglub rows:', cncglubError);
      return NextResponse.json({ error: 'Failed to fetch cncglub data' }, { status: 500 });
    }

    console.log(`Query returned ${cncglubRows.length} rows`);
    
    // Safety check - prevent processing too many rows at once
    if (cncglubRows.length > 10000) {
      return NextResponse.json({ 
        error: `Too many rows to process (${cncglubRows.length}). Please use more specific filters to reduce the dataset to under 10,000 rows.` 
      }, { status: 400 });
    }
    
    if (cncglubRows.length > 0) {
      console.log('Sample row:', {
        cncg_id: cncglubRows[0].cncg_id,
        rel_city_id: cncglubRows[0].rel_city_id,
        city_name: cncglubRows[0].cities?.city_name,
        country: cncglubRows[0].cities?.country,
        population: cncglubRows[0].cities?.city_population,
        industry_id: cncglubRows[0].rel_industry_id
      });
    }

    // Step 2: Create new tag in keywordshub_tags
    const { data: tagData, error: tagError } = await supabase
      .from('keywordshub_tags')
      .insert({ 
        tag_name,
        user_id: user_internal_id 
      })
      .select('tag_id')
      .single();

    if (tagError) {
      console.error('Error creating tag:', tagError);
      return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
    }

    const tagId = tagData.tag_id;

    // Step 3: Process each cncglub row
    const createdKeywords = [];
    const cncglubUpdates = [];
    let keywordsCreatedCount = 0;
    let existingKeywordsCount = 0;

    console.log(`Processing ${cncglubRows.length} cncglub rows...`);

    for (const row of cncglubRows) {
      const city = row.cities;
      if (!city) {
        console.log(`Skipping row ${row.cncg_id} - no city data`);
        continue;
      }

      // Render dynamic shortcodes in kw_rubric
      let renderedKeyword = kw_rubric;
      if (renderedKeyword.includes('(city_name)')) {
        renderedKeyword = renderedKeyword.replace(/\(city_name\)/g, city.city_name);
      }
      if (renderedKeyword.includes('(state_code)')) {
        renderedKeyword = renderedKeyword.replace(/\(state_code\)/g, city.state_code);
      }

      console.log(`Rendered keyword for ${city.city_name}: ${renderedKeyword}`);

      // Check if keyword already exists
      const { data: existingKeyword, error: keywordCheckError } = await supabase
        .from('keywordshub')
        .select('keyword_id')
        .eq('keyword_datum', renderedKeyword)
        .eq('rel_dfs_location_code', parseInt(rel_dfs_location_code))
        .eq('language_code', language_code)
        .maybeSingle();

      let keywordId;
      let wasCreated = false;

      if (existingKeyword) {
        // Keyword exists, use existing ID
        keywordId = existingKeyword.keyword_id;
        existingKeywordsCount++;
        console.log(`Using existing keyword ID: ${keywordId}`);
      } else {
        // Create new keyword
        const { data: newKeyword, error: keywordInsertError } = await supabase
          .from('keywordshub')
          .insert({
            keyword_datum: renderedKeyword,
            rel_dfs_location_code: parseInt(rel_dfs_location_code),
            language_code: language_code,
            language_name: 'English'
          })
          .select('keyword_id')
          .single();

        if (keywordInsertError) {
          console.error('Error creating keyword:', keywordInsertError);
          console.error('Failed for keyword:', renderedKeyword, 'City:', city.city_name);
          
          // If too many consecutive errors, abort the process
          if (keywordsCreatedCount === 0 && existingKeywordsCount === 0 && createdKeywords.length > 10) {
            return NextResponse.json({ 
              error: 'Too many consecutive keyword creation errors. Please check database schema.' 
            }, { status: 500 });
          }
          continue;
        }

        keywordId = newKeyword.keyword_id;
        keywordsCreatedCount++;
        wasCreated = true;
        console.log(`Created new keyword ID: ${keywordId}`);
      }

      // Tag the keyword
      try {
        const { error: tagAssignError } = await supabase
          .from('keywordshub_tag_relations')
          .insert({
            fk_keyword_id: keywordId,
            fk_tag_id: tagId
          });

        if (tagAssignError && !tagAssignError.message.includes('duplicate key')) {
          console.error('Error assigning tag (continuing):', tagAssignError.message);
        }
      } catch (tagError) {
        console.log('Tag assignment failed, continuing...', tagError);
      }

      // Prepare cncglub update
      const updateData: any = {};
      const slotNumber = kwslot.replace('kwslot', '');
      updateData[`kwslot${slotNumber}`] = keywordId;

      cncglubUpdates.push({
        cncg_id: row.cncg_id,
        updateData
      });

      createdKeywords.push({
        keyword_id: keywordId,
        keyword_datum: renderedKeyword,
        city_name: city.city_name,
        state_code: city.state_code,
        was_created: wasCreated
      });
    }

    // Step 4: Update cncglub rows with keyword IDs
    for (const update of cncglubUpdates) {
      const { error: updateError } = await supabase
        .from('cncglub')
        .update(update.updateData)
        .eq('cncg_id', update.cncg_id);

      if (updateError) {
        console.error('Error updating cncglub:', updateError);
      }
    }

    // Step 5: Create fabrication_launches record
    const { data: launchData, error: launchError } = await supabase
      .from('fabrication_launches')
      .insert({
        rel_keywordshub_tag_id: tagId,
        user_id: user_internal_id,
        opt_country: country,
        opt_industry_id: industry_id ? parseInt(industry_id) : null,
        opt_city_population_filter: city_population_filter,
        opt_kw_style: kw_rubric,
        opt_kw_slot: kwslot,
        opt_rel_dfs_location_code: parseInt(rel_dfs_location_code),
        opt_language_code: language_code,
        status: 'completed'
      })
      .select('launch_id')
      .single();

    if (launchError) {
      console.error('Error creating fabrication launch:', launchError);
    }

    console.log(`Final results: Created ${keywordsCreatedCount} new keywords, found ${existingKeywordsCount} existing, processed ${createdKeywords.length} total`);

    return NextResponse.json({
      success: true,
      message: `Processed ${cncglubRows.length} cncglub rows successfully`,
      tag_id: tagId,
      tag_name: tag_name,
      cncglub_rows_identified: cncglubRows.length,
      keywords_created: keywordsCreatedCount,
      keywords_existing: existingKeywordsCount,
      keywords_total: createdKeywords.length,
      cncglub_rows_updated: cncglubUpdates.length,
      launch_id: launchData?.launch_id || 'N/A'
    });

  } catch (error) {
    console.error('F370 function error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}