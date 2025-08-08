import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    dfs_username_exists: !!process.env.DFS_USERNAME,
    dfs_password_exists: !!process.env.DFS_PASSWORD,
    dfs_username_length: process.env.DFS_USERNAME?.length || 0,
    dfs_password_length: process.env.DFS_PASSWORD?.length || 0,
    dfs_username_first_3_chars: process.env.DFS_USERNAME?.substring(0, 3) || 'none',
    node_env: process.env.NODE_ENV
  });
}