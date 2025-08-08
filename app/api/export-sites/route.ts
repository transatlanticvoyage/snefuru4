import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stringify } from 'csv-stringify/sync';
import * as XLSX from 'xlsx';

interface ExportRequest {
  format: 'csv' | 'xlsx' | 'sql';
  scope: 'selected' | 'all';
  siteIds?: number[];
  columns: string[];
  userId: string;
}

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body: ExportRequest = await request.json();
    const { format, scope, siteIds, columns, userId } = body;

    console.log('🚀 Starting export:', { format, scope, columns: columns.length, userId });

    // Validate request
    if (!format || !scope || !columns.length || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (scope === 'selected' && (!siteIds || siteIds.length === 0)) {
      return NextResponse.json(
        { error: 'No sites selected for export' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('sitespren')
      .select(columns.join(', '))
      .eq('fk_users_id', userId)
      .order('id', { ascending: true });

    // Apply site ID filter for selected scope
    if (scope === 'selected' && siteIds) {
      query = query.in('id', siteIds);
    }

    // Execute query
    const { data: sites, error } = await query;

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch site data', details: error.message },
        { status: 500 }
      );
    }

    if (!sites || sites.length === 0) {
      return NextResponse.json(
        { error: 'No sites found to export' },
        { status: 404 }
      );
    }

    console.log(`📊 Retrieved ${sites.length} sites for export`);

    // Generate export data based on format
    let fileContent: string | Buffer;
    let filename: string;
    let contentType: string;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const scopeLabel = scope === 'selected' ? 'selected' : 'all';

    switch (format) {
      case 'csv':
        const csvOptions = {
          header: true,
          columns: columns.map(col => ({ key: col, header: col }))
        };
        fileContent = stringify(sites, csvOptions);
        filename = `sites-export-${scopeLabel}-${timestamp}.csv`;
        contentType = 'text/csv';
        break;

      case 'xlsx':
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(sites);
        
        // Set column widths
        const columnWidths = columns.map(col => ({ wch: Math.max(col.length, 15) }));
        worksheet['!cols'] = columnWidths;
        
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sites Export');
        fileContent = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        filename = `sites-export-${scopeLabel}-${timestamp}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;

      case 'sql':
        const tableName = 'sitespren_export';
        const sqlHeader = `-- Sites Export (${scopeLabel}) - Generated ${new Date().toISOString()}\n-- Total records: ${sites.length}\n\n`;
        
        const createTable = `CREATE TABLE IF NOT EXISTS ${tableName} (\n${columns.map(col => `  ${col} TEXT`).join(',\n')}\n);\n\n`;
        
        const insertStatements = sites.map(site => {
          const values = columns.map(col => {
            const value = site[col];
            if (value === null || value === undefined) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            return String(value);
          }).join(', ');
          return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});`;
        }).join('\n');

        fileContent = sqlHeader + createTable + insertStatements;
        filename = `sites-export-${scopeLabel}-${timestamp}.sql`;
        contentType = 'application/sql';
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported export format' },
          { status: 400 }
        );
    }

    console.log(`✅ Export generated: ${filename} (${typeof fileContent === 'string' ? fileContent.length : fileContent.length} bytes)`);

    // Return file with appropriate headers
    const response = new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

    return response;

  } catch (error) {
    console.error('❌ Export failed:', error);
    return NextResponse.json(
      { 
        error: 'Export failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID required' },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get total sites count for user
    const { count, error } = await supabase
      .from('sitespren')
      .select('*', { count: 'exact', head: true })
      .eq('fk_users_id', userId);

    if (error) {
      console.error('Failed to get sites count:', error);
      return NextResponse.json(
        { error: 'Failed to get sites count' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      totalSites: count || 0
    });

  } catch (error) {
    console.error('Failed to get export info:', error);
    return NextResponse.json(
      { error: 'Failed to get export info' },
      { status: 500 }
    );
  }
}