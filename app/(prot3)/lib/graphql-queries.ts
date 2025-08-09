import { gql } from '@apollo/client';

export const GET_SITESPREN_DATA = gql`
  query GetSitesprenData(
    $filters: [FilterInput]
    $sort: [SortInput]
    $pagination: PaginationInput
    $columns: [String!]
  ) {
    sitesprenData(
      filters: $filters
      sort: $sort
      pagination: $pagination
      columns: $columns
    ) {
      data {
        id
        created_at
        sitespren_base
        true_root_domain
        full_subdomain
        webproperty_type
        fk_users_id
        updated_at
        wpuser1
        wppass1
        wp_plugin_installed1
        wp_plugin_connected2
        fk_domreg_hostaccount
        is_wp_site
        wp_rest_app_pass
        driggs_industry
        driggs_city
        driggs_brand_name
        driggs_site_type_purpose
        driggs_email_1
        driggs_address_full
        driggs_phone_1
        driggs_special_note_for_ai_tool
        ns_full
        ip_address
        is_starred1
        icon_name
        icon_color
        is_bulldozer
        driggs_phone1_platform_id
        driggs_cgig_id
        driggs_revenue_goal
        driggs_address_species_id
        is_competitor
        is_external
        is_internal
        is_ppx
        is_ms
        is_wayback_rebuild
        is_naked_wp_build
        is_rnr
        is_aff
        is_other1
        is_other2
        driggs_citations_done
        is_flylocal
      }
      totalCount
      hasNextPage
    }
  }
`;

export interface SitesprenData {
  id: string;
  created_at?: string;
  sitespren_base?: string;
  true_root_domain?: string;
  full_subdomain?: string;
  webproperty_type?: string;
  fk_users_id?: string;
  updated_at?: string;
  wpuser1?: string;
  wppass1?: string;
  wp_plugin_installed1?: boolean;
  wp_plugin_connected2?: boolean;
  fk_domreg_hostaccount?: string;
  is_wp_site?: boolean;
  wp_rest_app_pass?: string;
  driggs_industry?: string;
  driggs_city?: string;
  driggs_brand_name?: string;
  driggs_site_type_purpose?: string;
  driggs_email_1?: string;
  driggs_address_full?: string;
  driggs_phone_1?: string;
  driggs_special_note_for_ai_tool?: string;
  ns_full?: string;
  ip_address?: string;
  is_starred1?: string;
  icon_name?: string;
  icon_color?: string;
  is_bulldozer?: boolean;
  driggs_phone1_platform_id?: number;
  driggs_cgig_id?: number;
  driggs_revenue_goal?: number;
  driggs_address_species_id?: number;
  is_competitor?: boolean;
  is_external?: boolean;
  is_internal?: boolean;
  is_ppx?: boolean;
  is_ms?: boolean;
  is_wayback_rebuild?: boolean;
  is_naked_wp_build?: boolean;
  is_rnr?: boolean;
  is_aff?: boolean;
  is_other1?: boolean;
  is_other2?: boolean;
  driggs_citations_done?: boolean;
  is_flylocal?: boolean;
}

export interface FilterInput {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'in';
  value: string;
}

export interface SortInput {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationInput {
  offset: number;
  limit: number;
}