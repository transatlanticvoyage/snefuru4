-- Create API Key Slots and Related Tables
-- Run this in Supabase SQL Editor

-- Create iservice_providers table
CREATE TABLE IF NOT EXISTS public.iservice_providers (
  provider_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  provider_slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_models table  
CREATE TABLE IF NOT EXISTS public.ai_models (
  model_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  model_slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create api_key_slots table
CREATE TABLE IF NOT EXISTS public.api_key_slots (
  slot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_name TEXT NOT NULL,
  m1name TEXT,
  m1inuse BOOLEAN DEFAULT FALSE,
  m2name TEXT, 
  m2inuse BOOLEAN DEFAULT FALSE,
  m3name TEXT,
  m3inuse BOOLEAN DEFAULT FALSE,
  count_active_modules_on_slot INTEGER GENERATED ALWAYS AS (
    (CASE WHEN m1inuse THEN 1 ELSE 0 END) +
    (CASE WHEN m2inuse THEN 1 ELSE 0 END) +
    (CASE WHEN m3inuse THEN 1 ELSE 0 END)
  ) STORED,
  fk_iservices_provider_id UUID REFERENCES public.iservice_providers(provider_id),
  fk_ai_model_id UUID REFERENCES public.ai_models(model_id),
  slot_publicly_shown BOOLEAN DEFAULT FALSE,
  is_ai_model BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add some sample data for testing
INSERT INTO public.iservice_providers (provider_name, provider_slug) VALUES
  ('OpenAI', 'openai'),
  ('Anthropic', 'anthropic'),
  ('Google', 'google'),
  ('Microsoft', 'microsoft')
ON CONFLICT (provider_slug) DO NOTHING;

INSERT INTO public.ai_models (model_name, model_slug) VALUES
  ('GPT-4', 'gpt-4'),
  ('Claude 3.5 Sonnet', 'claude-3-5-sonnet'),
  ('Gemini Pro', 'gemini-pro'),
  ('GPT-3.5 Turbo', 'gpt-3-5-turbo')
ON CONFLICT (model_slug) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE public.api_key_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iservice_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view api_key_slots" ON public.api_key_slots 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage api_key_slots" ON public.api_key_slots 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Users can view providers" ON public.iservice_providers 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view ai_models" ON public.ai_models 
  FOR SELECT USING (auth.role() = 'authenticated');

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_key_slots_created_at ON public.api_key_slots(created_at);
CREATE INDEX IF NOT EXISTS idx_api_key_slots_provider ON public.api_key_slots(fk_iservices_provider_id);
CREATE INDEX IF NOT EXISTS idx_api_key_slots_ai_model ON public.api_key_slots(fk_ai_model_id);