import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Mock image generation function
async function generateImage({ plan, aiModel }: { plan: any; aiModel: string }) {
  // In a real implementation, call your AI image generation API here
  // For now, just return a mock image object
  return {
    img_file_url1: `https://dummyimage.com/512x512/000/fff&text=${encodeURIComponent(plan.e_prompt1 || 'AI')}`,
    img_file_extension: 'png',
    img_file_size: 123456,
    width: 512,
    height: 512,
    prompt1: plan.e_prompt1 || '',
    status: 'completed',
    function_used_to_fetch_the_image: aiModel,
  };
}

export async function POST(request: Request) {
  try {
    const { records, qty, aiModel } = await request.json();
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ success: false, message: 'No records provided' }, { status: 400 });
    }
    const supabase = createRouteHandlerClient({ cookies });
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ success: false, message: 'User not authenticated' }, { status: 401 });
    }
    // Get user's DB id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();
    if (userError || !userData) {
      return NextResponse.json({ success: false, message: 'Could not find user record' }, { status: 400 });
    }
    // 1. Create a new batch row
    const { data: batchData, error: batchError } = await supabase
      .from('images_plans_batches')
      .insert({ rel_users_id: userData.id })
      .select('id')
      .single();
    if (batchError || !batchData) {
      return NextResponse.json({ success: false, message: 'Failed to create batch: ' + (batchError?.message || 'Unknown error') }, { status: 500 });
    }
    const batchId = batchData.id;

    // 2. Insert all images_plans rows with rel_images_plans_batches_id set
    //    and collect their ids for later update
    const recordsToInsert = records.map((rec: any) => ({ ...rec, rel_users_id: userData.id, rel_images_plans_batches_id: batchId }));
    const { data: plansData, error: plansError } = await supabase
      .from('images_plans')
      .insert(recordsToInsert)
      .select();
    if (plansError) {
      return NextResponse.json({ success: false, message: plansError.message }, { status: 500 });
    }

    // 3. For each plan, generate images, insert them, and update the plan with fk_imageX_id
    const updatedPlans = [];
    for (let i = 0; i < plansData.length; i++) {
      const plan = plansData[i];
      const imageIds: (string | null)[] = [];
      for (let j = 0; j < Math.min(qty, 4); j++) {
        // Generate image (mocked)
        const imageData = await generateImage({ plan, aiModel });
        // Insert image into images table
        const { data: imageInsert, error: imageError } = await supabase
          .from('images')
          .insert({
            rel_users_id: userData.id,
            rel_images_plans_id: plan.id,
            ...imageData,
          })
          .select('id')
          .single();
        if (imageError || !imageInsert) {
          imageIds.push(null);
        } else {
          imageIds.push(imageInsert.id);
        }
      }
      // Prepare update object for fk_image1_id ... fk_image4_id
      const updateObj: Record<string, string | null> = {};
      for (let k = 0; k < 4; k++) {
        updateObj[`fk_image${k + 1}_id`] = imageIds[k] || null;
      }
      // Update the plan row
      await supabase
        .from('images_plans')
        .update(updateObj)
        .eq('id', plan.id);
      updatedPlans.push({ ...plan, ...updateObj });
    }

    return NextResponse.json({
      success: true,
      message: `Inserted ${plansData.length} plans and generated images for each in batch ${batchId}.`,
      batch_id: batchId,
      updated: updatedPlans,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' });
  }
} 