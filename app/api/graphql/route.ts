import { createYoga } from 'graphql-yoga'
import { createSchema } from 'graphql-yoga'
import { supabase } from '@/lib/supabase'

const typeDefs = `
  scalar DateTime
  scalar UUID

  type SitesprenData {
    id: UUID!
    created_at: DateTime
    sitespren_base: String
    true_root_domain: String
    full_subdomain: String
    webproperty_type: String
    fk_users_id: UUID
    updated_at: DateTime
    wpuser1: String
    wppass1: String
    wp_plugin_installed1: Boolean
    wp_plugin_connected2: Boolean
    fk_domreg_hostaccount: UUID
    is_wp_site: Boolean
    wp_rest_app_pass: String
    driggs_industry: String
    driggs_city: String
    driggs_brand_name: String
    driggs_site_type_purpose: String
    driggs_email_1: String
    driggs_address_full: String
    driggs_phone_1: String
    driggs_special_note_for_ai_tool: String
    ns_full: String
    ip_address: String
    is_starred1: String
    icon_name: String
    icon_color: String
    is_bulldozer: Boolean
    driggs_phone1_platform_id: Int
    driggs_cgig_id: Int
    driggs_revenue_goal: Int
    driggs_address_species_id: Int
    is_competitor: Boolean
    is_external: Boolean
    is_internal: Boolean
    is_ppx: Boolean
    is_ms: Boolean
    is_wayback_rebuild: Boolean
    is_naked_wp_build: Boolean
    is_rnr: Boolean
    is_aff: Boolean
    is_other1: Boolean
    is_other2: Boolean
    driggs_citations_done: Boolean
    is_flylocal: Boolean
  }

  input FilterInput {
    field: String!
    operator: String!
    value: String
  }

  input SortInput {
    field: String!
    direction: String!
  }

  input PaginationInput {
    offset: Int = 0
    limit: Int = 50
  }

  type SitesprenResult {
    data: [SitesprenData!]!
    totalCount: Int!
    hasNextPage: Boolean!
  }

  type Query {
    sitesprenData(
      filters: [FilterInput]
      sort: [SortInput]
      pagination: PaginationInput
      columns: [String!]
    ): SitesprenResult!
  }
`

const resolvers = {
  Query: {
    sitesprenData: async (_: any, args: any, context: any) => {
      const { filters = [], sort = [], pagination = { offset: 0, limit: 50 }, columns } = args
      
      // Get user from context/auth (you'll need to implement auth middleware)
      const userId = context.user?.id // This needs to be implemented based on your auth system
      
      let query = supabase
        .from('sitespren')
        .select(columns ? columns.join(',') : '*', { count: 'exact' })
        .eq('fk_users_id', userId)

      // Apply filters
      filters.forEach((filter: any) => {
        switch (filter.operator) {
          case 'equals':
            query = query.eq(filter.field, filter.value)
            break
          case 'contains':
            query = query.ilike(filter.field, `%${filter.value}%`)
            break
          case 'gt':
            query = query.gt(filter.field, filter.value)
            break
          case 'lt':
            query = query.lt(filter.field, filter.value)
            break
          case 'in':
            query = query.in(filter.field, filter.value.split(','))
            break
        }
      })

      // Apply sorting
      sort.forEach((sortItem: any) => {
        query = query.order(sortItem.field, { ascending: sortItem.direction === 'asc' })
      })

      // Apply pagination
      query = query.range(pagination.offset, pagination.offset + pagination.limit - 1)

      const { data, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      return {
        data: data || [],
        totalCount: count || 0,
        hasNextPage: (pagination.offset + pagination.limit) < (count || 0)
      }
    }
  }
}

const schema = createSchema({
  typeDefs,
  resolvers
})

const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Request, Response }
})

export { handleRequest as GET, handleRequest as POST }