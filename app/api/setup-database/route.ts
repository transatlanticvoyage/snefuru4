import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create users table
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          email TEXT UNIQUE,
          auth_id UUID UNIQUE,
          api_key TEXT
        );

        -- Create images_plans_batches table
        CREATE TABLE IF NOT EXISTS images_plans_batches (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          rel_users_id UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          note1 TEXT
        );

        -- Create images_plans table
        CREATE TABLE IF NOT EXISTS images_plans (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          rel_users_id UUID REFERENCES users(id),
          rel_images_plans_batches_id UUID REFERENCES images_plans_batches(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          e_zpf_img_code TEXT,
          e_width INTEGER,
          e_height INTEGER,
          e_associated_content1 TEXT,
          e_file_name1 TEXT,
          e_more_instructions1 TEXT,
          e_prompt1 TEXT,
          e_ai_tool1 TEXT
        );

        -- Create images table
        CREATE TABLE IF NOT EXISTS images (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          rel_users_id UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          rel_images_plans_id UUID REFERENCES images_plans(id),
          img_file_url1 TEXT,
          img_file_extension TEXT,
          img_file_size INTEGER,
          width INTEGER,
          height INTEGER,
          prompt1 TEXT,
          status TEXT
        );

        -- Create indexes for better query performance
        CREATE INDEX IF NOT EXISTS idx_images_plans_batches_user_id ON images_plans_batches(rel_users_id);
        CREATE INDEX IF NOT EXISTS idx_images_plans_user_id ON images_plans(rel_users_id);
        CREATE INDEX IF NOT EXISTS idx_images_plans_batch_id ON images_plans(rel_images_plans_batches_id);
        CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(rel_users_id);
        CREATE INDEX IF NOT EXISTS idx_images_plan_id ON images(rel_images_plans_id);
      `
    })

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to create tables',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Successfully created all tables and indexes',
      status: 'complete'
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to set up database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 