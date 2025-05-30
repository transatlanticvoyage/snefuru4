import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Simple health check query
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      message: 'Successfully connected to Supabase',
      status: 'healthy',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to connect to Supabase',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 