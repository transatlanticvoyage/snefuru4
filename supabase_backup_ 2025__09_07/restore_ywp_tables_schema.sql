-- =====================================================================
-- COMPLETE YWP TABLES RESTORATION SCHEMA
-- Extracted from backup: db_cluster-07-09-2025@06-30-54.backup
-- Date: September 7, 2025
-- 
-- This file contains all CREATE TABLE statements, constraints, indexes,
-- and relationships needed to restore the 9 deleted ywp_ tables
-- =====================================================================

-- =====================================================================
-- 1. YWP_SITES (Central site registry)
-- =====================================================================

CREATE TABLE public.ywp_sites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_url text NOT NULL,
    site_name text NOT NULL,
    admin_email text,
    wp_version text,
    api_key text,
    last_sync_at timestamp with time zone,
    sync_enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    fk_user_id uuid,
    fk_images_plans_batches_id uuid
);

ALTER TABLE public.ywp_sites OWNER TO postgres;
ALTER TABLE public.ywp_sites ENABLE ROW LEVEL SECURITY;

-- Primary Key
ALTER TABLE ONLY public.ywp_sites
    ADD CONSTRAINT ywp_sites_pkey PRIMARY KEY (id);

-- Unique Constraint
ALTER TABLE ONLY public.ywp_sites
    ADD CONSTRAINT ywp_sites_site_url_key UNIQUE (site_url);

-- Indexes
CREATE INDEX idx_ywp_sites_api_key ON public.ywp_sites USING btree (api_key);
CREATE INDEX idx_ywp_sites_fk_images_plans_batches_id ON public.ywp_sites USING btree (fk_images_plans_batches_id);
CREATE INDEX idx_ywp_sites_fk_user_id ON public.ywp_sites USING btree (fk_user_id);
CREATE INDEX idx_ywp_sites_url ON public.ywp_sites USING btree (site_url);

-- =====================================================================
-- 2. YWP_USERS (WordPress users)
-- =====================================================================

CREATE TABLE public.ywp_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    wp_user_id bigint NOT NULL,
    user_login text NOT NULL,
    user_email text,
    user_nicename text,
    display_name text,
    user_role text,
    user_status integer DEFAULT 0,
    user_registered timestamp with time zone,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ywp_users OWNER TO postgres;
ALTER TABLE public.ywp_users ENABLE ROW LEVEL SECURITY;

-- Primary Key
ALTER TABLE ONLY public.ywp_users
    ADD CONSTRAINT ywp_users_pkey PRIMARY KEY (id);

-- Unique Constraint
ALTER TABLE ONLY public.ywp_users
    ADD CONSTRAINT ywp_users_site_id_wp_user_id_key UNIQUE (site_id, wp_user_id);

-- Foreign Key
ALTER TABLE ONLY public.ywp_users
    ADD CONSTRAINT ywp_users_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.ywp_sites(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX idx_ywp_users_email ON public.ywp_users USING btree (user_email);
CREATE INDEX idx_ywp_users_site_wp_id ON public.ywp_users USING btree (site_id, wp_user_id);

-- =====================================================================
-- 3. YWP_POSTS (WordPress posts)
-- =====================================================================

CREATE TABLE public.ywp_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    wp_post_id bigint NOT NULL,
    post_author uuid,
    post_date timestamp with time zone,
    post_date_gmt timestamp with time zone,
    post_content text,
    post_title text,
    post_excerpt text,
    post_status text DEFAULT 'draft'::text,
    comment_status text DEFAULT 'closed'::text,
    ping_status text DEFAULT 'closed'::text,
    post_password text,
    post_name text,
    post_modified timestamp with time zone,
    post_modified_gmt timestamp with time zone,
    post_content_filtered text,
    post_parent bigint DEFAULT 0,
    guid text,
    menu_order integer DEFAULT 0,
    post_type text DEFAULT 'post'::text,
    post_mime_type text,
    comment_count bigint DEFAULT 0,
    featured_image_url text,
    seo_title text,
    seo_description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ywp_posts OWNER TO postgres;
ALTER TABLE public.ywp_posts ENABLE ROW LEVEL SECURITY;

-- Primary Key
ALTER TABLE ONLY public.ywp_posts
    ADD CONSTRAINT ywp_posts_pkey PRIMARY KEY (id);

-- Unique Constraint
ALTER TABLE ONLY public.ywp_posts
    ADD CONSTRAINT ywp_posts_site_id_wp_post_id_key UNIQUE (site_id, wp_post_id);

-- Foreign Keys
ALTER TABLE ONLY public.ywp_posts
    ADD CONSTRAINT ywp_posts_post_author_fkey FOREIGN KEY (post_author) REFERENCES public.ywp_users(id);

ALTER TABLE ONLY public.ywp_posts
    ADD CONSTRAINT ywp_posts_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.ywp_sites(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX idx_ywp_posts_author ON public.ywp_posts USING btree (post_author);
CREATE INDEX idx_ywp_posts_date ON public.ywp_posts USING btree (post_date);
CREATE INDEX idx_ywp_posts_modified ON public.ywp_posts USING btree (post_modified);
CREATE INDEX idx_ywp_posts_parent ON public.ywp_posts USING btree (post_parent);
CREATE INDEX idx_ywp_posts_site_wp_id ON public.ywp_posts USING btree (site_id, wp_post_id);
CREATE INDEX idx_ywp_posts_type_status ON public.ywp_posts USING btree (post_type, post_status);

-- =====================================================================
-- 4. YWP_CONTENT (Simplified post content)
-- =====================================================================

CREATE TABLE public.ywp_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    fk_site_id uuid,
    post_id integer NOT NULL,
    post_title text,
    post_content text,
    post_excerpt text,
    post_status character varying(20) DEFAULT 'publish'::character varying,
    post_type character varying(20) DEFAULT 'post'::character varying,
    post_date timestamp with time zone,
    post_modified timestamp with time zone,
    post_author integer,
    post_slug text,
    post_parent integer DEFAULT 0,
    menu_order integer DEFAULT 0,
    comment_status character varying(20) DEFAULT 'open'::character varying,
    ping_status character varying(20) DEFAULT 'open'::character varying,
    post_password text,
    post_name text,
    to_ping text,
    pinged text,
    post_content_filtered text,
    guid text,
    post_mime_type character varying(100),
    comment_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    sync_method character varying(20) DEFAULT 'plugin_api'::character varying,
    raw_metadata jsonb,
    sync_version integer DEFAULT 1,
    CONSTRAINT ywp_content_sync_method_check CHECK (((sync_method)::text = ANY ((ARRAY['rest_api'::character varying, 'plugin_api'::character varying])::text[])))
);

ALTER TABLE public.ywp_content OWNER TO postgres;
ALTER TABLE public.ywp_content ENABLE ROW LEVEL SECURITY;

-- Primary Key
ALTER TABLE ONLY public.ywp_content
    ADD CONSTRAINT ywp_content_pkey PRIMARY KEY (id);

-- Unique Constraint
ALTER TABLE ONLY public.ywp_content
    ADD CONSTRAINT ywp_content_fk_site_id_post_id_key UNIQUE (fk_site_id, post_id);

-- Foreign Key
ALTER TABLE ONLY public.ywp_content
    ADD CONSTRAINT ywp_content_fk_site_id_fkey FOREIGN KEY (fk_site_id) REFERENCES public.ywp_sites(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX idx_ywp_content_post_date ON public.ywp_content USING btree (post_date);
CREATE INDEX idx_ywp_content_post_status ON public.ywp_content USING btree (post_status);
CREATE INDEX idx_ywp_content_post_type ON public.ywp_content USING btree (post_type);
CREATE INDEX idx_ywp_content_raw_metadata ON public.ywp_content USING gin (raw_metadata);
CREATE INDEX idx_ywp_content_site_id ON public.ywp_content USING btree (fk_site_id);
CREATE INDEX idx_ywp_content_sync_method ON public.ywp_content USING btree (sync_method);

-- =====================================================================
-- 5. YWP_TAXONOMIES (Categories, tags, custom taxonomies)
-- =====================================================================

CREATE TABLE public.ywp_taxonomies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    wp_term_id bigint NOT NULL,
    wp_term_taxonomy_id bigint,
    name text NOT NULL,
    slug text NOT NULL,
    taxonomy text NOT NULL,
    description text,
    parent_id uuid,
    count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ywp_taxonomies OWNER TO postgres;
ALTER TABLE public.ywp_taxonomies ENABLE ROW LEVEL SECURITY;

-- Primary Key
ALTER TABLE ONLY public.ywp_taxonomies
    ADD CONSTRAINT ywp_taxonomies_pkey PRIMARY KEY (id);

-- Unique Constraint
ALTER TABLE ONLY public.ywp_taxonomies
    ADD CONSTRAINT ywp_taxonomies_site_id_wp_term_id_taxonomy_key UNIQUE (site_id, wp_term_id, taxonomy);

-- Foreign Keys
ALTER TABLE ONLY public.ywp_taxonomies
    ADD CONSTRAINT ywp_taxonomies_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.ywp_taxonomies(id);

ALTER TABLE ONLY public.ywp_taxonomies
    ADD CONSTRAINT ywp_taxonomies_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.ywp_sites(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX idx_ywp_taxonomies_parent ON public.ywp_taxonomies USING btree (parent_id);
CREATE INDEX idx_ywp_taxonomies_site_term ON public.ywp_taxonomies USING btree (site_id, wp_term_id);
CREATE INDEX idx_ywp_taxonomies_slug ON public.ywp_taxonomies USING btree (slug);
CREATE INDEX idx_ywp_taxonomies_taxonomy ON public.ywp_taxonomies USING btree (taxonomy);

-- =====================================================================
-- 6. YWP_POST_META (Post metadata key-value pairs)
-- =====================================================================

CREATE TABLE public.ywp_post_meta (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    site_id uuid NOT NULL,
    wp_meta_id bigint,
    meta_key text NOT NULL,
    meta_value text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ywp_post_meta OWNER TO postgres;
ALTER TABLE public.ywp_post_meta ENABLE ROW LEVEL SECURITY;

-- Primary Key
ALTER TABLE ONLY public.ywp_post_meta
    ADD CONSTRAINT ywp_post_meta_pkey PRIMARY KEY (id);

-- Foreign Keys
ALTER TABLE ONLY public.ywp_post_meta
    ADD CONSTRAINT ywp_post_meta_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.ywp_posts(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.ywp_post_meta
    ADD CONSTRAINT ywp_post_meta_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.ywp_sites(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX idx_ywp_post_meta_key_value ON public.ywp_post_meta USING btree (meta_key, meta_value);
CREATE INDEX idx_ywp_post_meta_post_key ON public.ywp_post_meta USING btree (post_id, meta_key);

-- =====================================================================
-- 7. YWP_POST_TAXONOMIES (Post-taxonomy relationships)
-- =====================================================================

CREATE TABLE public.ywp_post_taxonomies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    taxonomy_id uuid NOT NULL,
    site_id uuid NOT NULL,
    term_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ywp_post_taxonomies OWNER TO postgres;
ALTER TABLE public.ywp_post_taxonomies ENABLE ROW LEVEL SECURITY;

-- Primary Key
ALTER TABLE ONLY public.ywp_post_taxonomies
    ADD CONSTRAINT ywp_post_taxonomies_pkey PRIMARY KEY (id);

-- Unique Constraint
ALTER TABLE ONLY public.ywp_post_taxonomies
    ADD CONSTRAINT ywp_post_taxonomies_post_id_taxonomy_id_key UNIQUE (post_id, taxonomy_id);

-- Foreign Keys
ALTER TABLE ONLY public.ywp_post_taxonomies
    ADD CONSTRAINT ywp_post_taxonomies_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.ywp_posts(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.ywp_post_taxonomies
    ADD CONSTRAINT ywp_post_taxonomies_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.ywp_sites(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.ywp_post_taxonomies
    ADD CONSTRAINT ywp_post_taxonomies_taxonomy_id_fkey FOREIGN KEY (taxonomy_id) REFERENCES public.ywp_taxonomies(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX idx_ywp_post_tax_post ON public.ywp_post_taxonomies USING btree (post_id);
CREATE INDEX idx_ywp_post_tax_taxonomy ON public.ywp_post_taxonomies USING btree (taxonomy_id);

-- =====================================================================
-- 8. YWP_MEDIA (Media/attachment files)
-- =====================================================================

CREATE TABLE public.ywp_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    wp_attachment_id bigint NOT NULL,
    post_id uuid,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_url text NOT NULL,
    mime_type text,
    file_size bigint,
    image_width integer,
    image_height integer,
    alt_text text,
    caption text,
    description text,
    upload_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ywp_media OWNER TO postgres;
ALTER TABLE public.ywp_media ENABLE ROW LEVEL SECURITY;

-- Primary Key
ALTER TABLE ONLY public.ywp_media
    ADD CONSTRAINT ywp_media_pkey PRIMARY KEY (id);

-- Unique Constraint
ALTER TABLE ONLY public.ywp_media
    ADD CONSTRAINT ywp_media_site_id_wp_attachment_id_key UNIQUE (site_id, wp_attachment_id);

-- Foreign Keys
ALTER TABLE ONLY public.ywp_media
    ADD CONSTRAINT ywp_media_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.ywp_posts(id);

ALTER TABLE ONLY public.ywp_media
    ADD CONSTRAINT ywp_media_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.ywp_sites(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX idx_ywp_media_mime_type ON public.ywp_media USING btree (mime_type);
CREATE INDEX idx_ywp_media_post_id ON public.ywp_media USING btree (post_id);
CREATE INDEX idx_ywp_media_site_wp_id ON public.ywp_media USING btree (site_id, wp_attachment_id);

-- =====================================================================
-- 9. YWP_SYNC_LOG (Synchronization logging)
-- =====================================================================

CREATE TABLE public.ywp_sync_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    sync_type text NOT NULL,
    operation text NOT NULL,
    wp_object_id bigint,
    object_type text,
    status text DEFAULT 'pending'::text,
    error_message text,
    records_processed integer DEFAULT 0,
    records_total integer DEFAULT 0,
    sync_data jsonb,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ywp_sync_log OWNER TO postgres;
ALTER TABLE public.ywp_sync_log ENABLE ROW LEVEL SECURITY;

-- Primary Key
ALTER TABLE ONLY public.ywp_sync_log
    ADD CONSTRAINT ywp_sync_log_pkey PRIMARY KEY (id);

-- Foreign Key
ALTER TABLE ONLY public.ywp_sync_log
    ADD CONSTRAINT ywp_sync_log_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.ywp_sites(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX idx_ywp_sync_log_created ON public.ywp_sync_log USING btree (created_at);
CREATE INDEX idx_ywp_sync_log_site_type ON public.ywp_sync_log USING btree (site_id, sync_type);
CREATE INDEX idx_ywp_sync_log_status ON public.ywp_sync_log USING btree (status);

-- =====================================================================
-- FOREIGN KEY CONSTRAINTS TO EXISTING TABLES
-- (These may fail if the referenced tables don't exist - comment out if needed)
-- =====================================================================

-- Link ywp_sites to main users table
ALTER TABLE ONLY public.ywp_sites
    ADD CONSTRAINT fk_ywp_sites_user_id FOREIGN KEY (fk_user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Link ywp_sites to images_plans_batches table  
ALTER TABLE ONLY public.ywp_sites
    ADD CONSTRAINT fk_ywp_sites_images_plans_batches_id FOREIGN KEY (fk_images_plans_batches_id) REFERENCES public.images_plans_batches(id) ON DELETE SET NULL;

-- =====================================================================
-- COMPLETION MESSAGE
-- =====================================================================

-- All 9 YWP tables have been recreated with:
-- ✓ Primary keys and unique constraints
-- ✓ Foreign key relationships with cascading deletes  
-- ✓ Comprehensive indexing for performance
-- ✓ Row Level Security enabled
-- ✓ Proper ownership and permissions
-- 
-- Your chepno functions should now work without any code changes!