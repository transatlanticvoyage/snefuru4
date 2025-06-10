import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const { prenbaseLines } = await req.json();
    
    if (!prenbaseLines || !Array.isArray(prenbaseLines) || prenbaseLines.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid prenbase data provided' },
        { status: 400 }
      );
    }

    // Get user's DB id from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();
      
    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'User record not found' },
        { status: 404 }
      );
    }

    // Enhanced validation for prenbaseLines
    const validPrenbase = prenbaseLines.filter(prenbase => {
      const trimmed = prenbase.trim();
      // Check if the prenbase is a non-empty string and within length constraints
      return typeof trimmed === 'string' && trimmed.length > 0 && trimmed.length <= 255;
    });

    if (validPrenbase.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid prenbase found. Ensure each entry is a non-empty string and within 255 characters.' },
        { status: 400 }
      );
    }

    // Prepare prenbase records for insertion
    const prenbaseRecords = validPrenbase.map(prenbase => ({
      prenbase1: prenbase.trim(),
      fk_users_id: userData.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Check for any additional constraints specific to the 'sitespren' table
    // For example, ensure 'prenbase1' is unique for the user
    const { data: existingData, error: existingError } = await supabase
      .from('sitespren')
      .select('prenbase1')
      .eq('fk_users_id', userData.id)
      .in('prenbase1', validPrenbase);

    if (existingError) {
      console.error('Error checking existing prenbase:', existingError);
      return NextResponse.json(
        { success: false, message: 'Error checking existing prenbase entries.' },
        { status: 500 }
      );
    }

    if (existingData.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Some prenbase entries already exist for this user.' },
        { status: 400 }
      );
    }

    // Insert prenbase into the database
    const { data, error: insertError } = await supabase
      .from('sitespren')
      .insert(prenbaseRecords)
      .select();
      
    if (insertError) {
      console.error('Database insertion error:', insertError);
      return NextResponse.json(
        { success: false, message: `Database error: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${validPrenbase.length} prenbase`,
      count: validPrenbase.length,
      data: data
    });

  } catch (error) {
    console.error('Error in sfunc_45_addtositespren:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 