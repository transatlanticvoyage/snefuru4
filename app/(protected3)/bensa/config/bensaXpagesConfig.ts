import { BensaTableConfig } from '../components/BensaFieldTableTypes';
import { syncXPageMetadataAPI } from '@/app/utils/syncXPageMetadata';

export const bensaXpagesConfig: BensaTableConfig = {
  tableName: 'xpages',
  primaryKey: 'xpage_id',
  fields: [
    { key: 'xpage_id', type: 'integer', editable: false },
    { key: 'title1', type: 'text', editable: true },
    { key: 'main_url', type: 'text', editable: true },
    { 
      key: 'meta_title', 
      type: 'text', 
      editable: true,
      syncButton: {
        enabled: true,
        syncFunction: syncXPageMetadataAPI
      }
    },
    { key: 'title2', type: 'text', editable: true },
    { key: 'desc1', type: 'text', editable: true },
    { key: 'caption', type: 'text', editable: true },
    { key: 'pagepath_url', type: 'text', editable: true },
    { key: 'pagepath_long', type: 'text', editable: true },
    { key: 'pagepath_short', type: 'text', editable: true },
    { key: 'position_marker', type: 'integer', editable: true },
    { key: 'show_in_all_pages_nav_area1', type: 'boolean', editable: true },
    { key: 'broad_parent_container', type: 'text', editable: true },
    { key: 'has_mutation_observer', type: 'text', editable: true },
    { key: 'urlparam_total_keys_listed', type: 'jsonb', editable: true },
    { key: 'created_at', type: 'timestamp', editable: false },
    { key: 'updated_at', type: 'timestamp', editable: false }
  ]
};