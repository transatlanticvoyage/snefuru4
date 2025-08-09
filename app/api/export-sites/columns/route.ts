import { NextResponse } from 'next/server';

export interface ColumnGroup {
  id: string;
  name: string;
  columns: ColumnDefinition[];
}

export interface ColumnDefinition {
  key: string;
  label: string;
  description?: string;
}

export const columnGroups: ColumnGroup[] = [
  {
    id: 'core',
    name: 'Core Fields',
    columns: [
      { key: 'id', label: 'ID', description: 'Site ID' },
      { key: 'sitespren_base', label: 'Domain', description: 'Base domain' },
      { key: 'created_at', label: 'Created', description: 'Creation date' },
      { key: 'updated_at', label: 'Updated', description: 'Last update date' },
      { key: 'true_root_domain', label: 'Root Domain', description: 'True root domain' },
      { key: 'full_subdomain', label: 'Full Subdomain', description: 'Complete subdomain' },
      { key: 'webproperty_type', label: 'Web Property Type', description: 'Type of web property' }
    ]
  },
  {
    id: 'network',
    name: 'Network & Hosting',
    columns: [
      { key: 'ns_full', label: 'Name Servers', description: 'Full name server info' },
      { key: 'ip_address', label: 'IP Address', description: 'Server IP address' },
      { key: 'domain_registrar_info', label: 'Registrar Info', description: 'Domain registrar information' },
      { key: 'fk_domreg_hostaccount', label: 'Host Account FK', description: 'Host account foreign key' }
    ]
  },
  {
    id: 'wordpress',
    name: 'WordPress Fields',
    columns: [
      { key: 'wpuser1', label: 'WP Username', description: 'WordPress admin username' },
      { key: 'wppass1', label: 'WP Password', description: 'WordPress admin password' },
      { key: 'wp_plugin_installed1', label: 'Plugin Installed', description: 'WordPress plugin status' },
      { key: 'wp_plugin_connected2', label: 'Plugin Connected', description: 'WordPress plugin connection status' },
      { key: 'wp_rest_app_pass', label: 'WP REST Password', description: 'WordPress REST API password' },
      { key: 'is_wp_site', label: 'Is WordPress', description: 'WordPress site flag' }
    ]
  },
  {
    id: 'flags',
    name: 'Boolean Flags',
    columns: [
      { key: 'is_bulldozer', label: 'Bulldozer', description: 'Bulldozer flag' },
      { key: 'is_competitor', label: 'Competitor', description: 'Competitor site flag' },
      { key: 'is_external', label: 'External', description: 'External site flag' },
      { key: 'is_internal', label: 'Internal', description: 'Internal site flag' },
      { key: 'is_ppx', label: 'PPX', description: 'PPX flag' },
      { key: 'is_ms', label: 'MS', description: 'MS flag' },
      { key: 'is_wayback_rebuild', label: 'Wayback Rebuild', description: 'Wayback rebuild flag' },
      { key: 'is_naked_wp_build', label: 'Naked WP Build', description: 'Naked WordPress build flag' },
      { key: 'is_rnr', label: 'RnR', description: 'RnR flag' },
      { key: 'is_aff', label: 'Affiliate', description: 'Affiliate flag' },
      { key: 'is_other1', label: 'Other 1', description: 'Other 1 flag' },
      { key: 'is_other2', label: 'Other 2', description: 'Other 2 flag' },
      { key: 'is_flylocal', label: 'Flylocal', description: 'Flylocal flag' },
      { key: 'is_starred1', label: 'Starred', description: 'Star status' }
    ]
  },
  {
    id: 'metadata',
    name: 'Metadata',
    columns: [
      { key: 'fk_users_id', label: 'User ID', description: 'Owner user ID' },
      { key: 'tags', label: 'Tags', description: 'Site tags' },
      { key: 'notes', label: 'Notes', description: 'Site notes' }
    ]
  }
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      columnGroups: columnGroups,
      allColumns: columnGroups.flatMap(group => group.columns)
    });
  } catch (error) {
    console.error('Failed to get column definitions:', error);
    return NextResponse.json(
      { error: 'Failed to get column definitions' },
      { status: 500 }
    );
  }
}