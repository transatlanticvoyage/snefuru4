import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sitesprenId = url.searchParams.get('sitespren_id');
    
    if (!sitesprenId) {
      return NextResponse.json({ error: 'sitespren_id parameter required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    console.log(`🔍 Debug Narpi: User auth ID: ${user.id}`);

    // Get database user ID
    const { data: dbUser, error: dbUserError } = await supabase
      .from('users')
      .select('id, email')
      .eq('auth_id', user.id)
      .single();

    if (dbUserError || !dbUser) {
      return NextResponse.json({ error: 'Database user not found', details: dbUserError }, { status: 404 });
    }

    console.log(`🔍 Debug Narpi: DB User ID: ${dbUser.id}, Email: ${dbUser.email}`);

    // Get sitespren info
    const { data: sitespren, error: sitesprenError } = await supabase
      .from('sitespren')
      .select('id, sitespren_base')
      .eq('id', sitesprenId)
      .single();

    if (sitesprenError || !sitespren) {
      return NextResponse.json({ error: 'Sitespren not found', details: sitesprenError }, { status: 404 });
    }

    console.log(`🔍 Debug Narpi: Sitespren: ${sitespren.sitespren_base}`);

    // Get all batches for this sitespren and user
    const { data: batchesData, error: batchesError } = await supabase
      .from('images_plans_batches')
      .select('id, batch_name, rel_users_id, asn_sitespren_id')
      .eq('rel_users_id', dbUser.id)
      .eq('asn_sitespren_id', sitesprenId);

    if (batchesError) {
      return NextResponse.json({ error: 'Error fetching batches', details: batchesError }, { status: 500 });
    }

    console.log(`🔍 Debug Narpi: Found ${batchesData?.length || 0} batches`);

    const batchIds = batchesData?.map(b => b.id) || [];

    if (batchIds.length === 0) {
      return NextResponse.json({
        debug: {
          user_auth_id: user.id,
          db_user_id: dbUser.id,
          sitespren_id: sitesprenId,
          sitespren_base: sitespren.sitespren_base,
          batches_found: 0,
          message: 'No batches found for this user and sitespren combination'
        }
      });
    }

    // Get all narpi_pushes for these batches
    const { data: narpiPushes, error: narpiError } = await supabase
      .from('narpi_pushes')
      .select('id, push_name, push_desc, created_at, push_status1, kareench1, fk_batch_id')
      .in('fk_batch_id', batchIds)
      .order('created_at', { ascending: false });

    if (narpiError) {
      return NextResponse.json({ error: 'Error fetching narpi pushes', details: narpiError }, { status: 500 });
    }

    console.log(`🔍 Debug Narpi: Found ${narpiPushes?.length || 0} narpi pushes`);

    // Analyze each push
    const pushAnalysis = (narpiPushes || []).map(push => {
      const kareench1 = push.kareench1 || [];
      const hasKareench1Data = Array.isArray(kareench1) && kareench1.length > 0;
      
      let uploadStatuses: string[] = [];
      let hasErrors = false;
      let successCount = 0;
      let failCount = 0;
      
      if (hasKareench1Data) {
        uploadStatuses = kareench1.map((item: any) => item.nupload_status1 || 'unknown');
        hasErrors = kareench1.some((item: any) => item.nupload_status1 === 'failed');
        successCount = kareench1.filter((item: any) => item.nupload_status1 === 'success').length;
        failCount = kareench1.filter((item: any) => item.nupload_status1 === 'failed').length;
      }
      
      const isCompleted = push.push_status1 === 'completed';
      const wouldBeIncluded = hasKareench1Data && !hasErrors && isCompleted;
      
      return {
        id: push.id,
        push_name: push.push_name,
        push_status1: push.push_status1,
        created_at: push.created_at,
        batch_id: push.fk_batch_id,
        has_kareench1_data: hasKareench1Data,
        kareench1_length: kareench1.length,
        upload_statuses: uploadStatuses,
        has_errors: hasErrors,
        success_count: successCount,
        fail_count: failCount,
        is_completed: isCompleted,
        would_be_included: wouldBeIncluded
      };
    });

    const eligiblePushes = pushAnalysis.filter(p => p.would_be_included);

    return NextResponse.json({
      debug: {
        user_auth_id: user.id,
        db_user_id: dbUser.id,
        user_email: dbUser.email,
        sitespren_id: sitesprenId,
        sitespren_base: sitespren.sitespren_base,
        batches_found: batchesData.length,
        batches: batchesData,
        total_narpi_pushes: narpiPushes?.length || 0,
        eligible_pushes: eligiblePushes.length,
        analysis: pushAnalysis
      }
    });

  } catch (error) {
    console.error('Debug narpi pushes error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}