import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
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
      tag_name
    } = body;

    // Step 1: Filter cncglub rows based on criteria
    let cncglubQuery = supabase
      .from('cncglub')
      .select(`
        cncg_id,
        rel_city_id,
        rel_industry_id,
        cities!rel_city_id (
          city_id,
          city_name,
          state_code,
          state_full,
          country,
          city_population
        ),
        industries!rel_industry_id (
          industry_id,
          industry_name
        )
      `);

    // Apply country filter
    if (country && country !== '') {
      cncglubQuery = cncglubQuery.eq('cities.country', country);
    }

    // Apply industry filter
    if (industry_id && industry_id !== '') {
      cncglubQuery = cncglubQuery.eq('rel_industry_id', parseInt(industry_id));
    }

    // Apply city population filter
    if (city_population_filter && city_population_filter !== 'all') {
      switch (city_population_filter) {
        case 'under-25k':
          cncglubQuery = cncglubQuery.lt('cities.city_population', 25000);
          break;
        case '25k-50k':
          cncglubQuery = cncglubQuery.gte('cities.city_population', 25000).lt('cities.city_population', 50000);
          break;
        case '50k-100k':
          cncglubQuery = cncglubQuery.gte('cities.city_population', 50000).lt('cities.city_population', 100000);
          break;
        case '75k-325k':
          cncglubQuery = cncglubQuery.gte('cities.city_population', 75000).lt('cities.city_population', 325000);
          break;
        case '100k-500k':
          cncglubQuery = cncglubQuery.gte('cities.city_population', 100000).lt('cities.city_population', 500000);
          break;
        case '500k-plus':
          cncglubQuery = cncglubQuery.gte('cities.city_population', 500000);
          break;
      }
    }

    const { data: cncglubRows, error: cncglubError } = await cncglubQuery;

    if (cncglubError) {
      console.error('Error fetching cncglub rows:', cncglubError);
      return NextResponse.json({ error: 'Failed to fetch cncglub data' }, { status: 500 });
    }

    // Step 2: Create new tag in keywordshub_tags
    const { data: tagData, error: tagError } = await supabase
      .from('keywordshub_tags')
      .insert({ tag_name })
      .select('tag_id')
      .single();

    if (tagError) {
      console.error('Error creating tag:', tagError);
      return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
    }

    const tagId = tagData.tag_id;

    // Step 3: Process each cncglub row
    const processedKeywords = [];
    const cncglubUpdates = [];

    for (const row of cncglubRows) {
      const city = row.cities;
      if (!city) continue;

      // Render dynamic shortcodes in kw_rubric
      let renderedKeyword = kw_rubric;
      if (renderedKeyword.includes('(city_name)')) {
        renderedKeyword = renderedKeyword.replace(/\(city_name\)/g, city.city_name);
      }
      if (renderedKeyword.includes('(state_code)')) {
        renderedKeyword = renderedKeyword.replace(/\(state_code\)/g, city.state_code);
      }

      // Check if keyword already exists
      const { data: existingKeyword, error: keywordCheckError } = await supabase
        .from('keywordshub')
        .select('keyword_id')
        .eq('keyword_datum', renderedKeyword)
        .eq('rel_dfs_location_code', rel_dfs_location_code)
        .eq('language_code', language_code)
        .single();

      let keywordId;

      if (existingKeyword) {
        // Keyword exists, use existing ID
        keywordId = existingKeyword.keyword_id;
      } else {
        // Create new keyword
        const { data: newKeyword, error: keywordInsertError } = await supabase
          .from('keywordshub')
          .insert({
            keyword_datum: renderedKeyword,
            rel_dfs_location_code: parseInt(rel_dfs_location_code),
            language_code: language_code
          })
          .select('keyword_id')
          .single();

        if (keywordInsertError) {
          console.error('Error creating keyword:', keywordInsertError);
          continue;
        }

        keywordId = newKeyword.keyword_id;
      }

      // Tag the keyword
      const { error: tagAssignError } = await supabase
        .from('keywordshub_tag_assignments')
        .insert({
          fk_keywordshub_id: keywordId,
          fk_keywordshub_tags_id: tagId
        });

      if (tagAssignError && !tagAssignError.message.includes('duplicate key')) {
        console.error('Error assigning tag:', tagAssignError);
      }

      // Prepare cncglub update
      const updateData: any = {};
      updateData[`kwslot${kwslot.replace('kwslot', '')}`] = keywordId;

      cncglubUpdates.push({
        cncg_id: row.cncg_id,
        updateData
      });

      processedKeywords.push({
        keyword_id: keywordId,
        keyword_datum: renderedKeyword,
        city_name: city.city_name,
        state_code: city.state_code
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
        user_id: 'system', // You may want to get actual user ID from session
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

    return NextResponse.json({
      success: true,
      message: `Processed ${processedKeywords.length} keywords from ${cncglubRows.length} cncglub rows`,
      tag_id: tagId,
      tag_name: tag_name,
      keywords_processed: processedKeywords.length,
      cncglub_rows_processed: cncglubRows.length,
      launch_id: launchData?.launch_id
    });

  } catch (error) {
    console.error('F370 function error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}