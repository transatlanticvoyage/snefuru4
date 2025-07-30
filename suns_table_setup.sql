-- Create suns table with no-gap packet_id paradigm
-- Run this SQL in your Supabase SQL Editor
-- Note: Indexes omitted due to account privilege restrictions

-- Drop existing suns table if it exists
DROP TABLE IF EXISTS public.suns CASCADE;

-- Create the main suns table with explicit public schema
CREATE TABLE public.suns (
    srs_global_id SERIAL PRIMARY KEY,
    srs_packet_id INTEGER NOT NULL,
    rel_utg_id TEXT NOT NULL,
    rel_mrm_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(rel_utg_id, srs_packet_id)
);

-- Function to get next packet_id for a given rel_utg_id
-- This ensures no gaps in the packet_id sequence within each group
CREATE OR REPLACE FUNCTION public.get_next_packet_id(utg_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    next_id INTEGER;
BEGIN
    SELECT COALESCE(MAX(srs_packet_id), 0) + 1 
    INTO next_id 
    FROM public.suns 
    WHERE rel_utg_id = utg_id;
    
    RETURN next_id;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set packet_id on insert
CREATE OR REPLACE FUNCTION public.set_packet_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set packet_id if it's not already provided
    IF NEW.srs_packet_id IS NULL THEN
        NEW.srs_packet_id := public.get_next_packet_id(NEW.rel_utg_id);
    END IF;
    
    -- Always update the updated_at timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to resequence packet_ids after deletion (maintains no-gap rule)
CREATE OR REPLACE FUNCTION public.resequence_packet_ids()
RETURNS TRIGGER AS $$
DECLARE
    rec RECORD;
    counter INTEGER := 1;
BEGIN
    -- Resequence all packet_ids for the affected rel_utg_id
    FOR rec IN 
        SELECT srs_global_id 
        FROM public.suns 
        WHERE rel_utg_id = OLD.rel_utg_id 
        ORDER BY srs_packet_id
    LOOP
        UPDATE public.suns 
        SET srs_packet_id = counter,
            updated_at = NOW()
        WHERE srs_global_id = rec.srs_global_id;
        
        counter := counter + 1;
    END LOOP;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_set_packet_id
    BEFORE INSERT ON public.suns
    FOR EACH ROW
    EXECUTE FUNCTION public.set_packet_id();

CREATE TRIGGER trigger_resequence_on_delete
    AFTER DELETE ON public.suns
    FOR EACH ROW
    EXECUTE FUNCTION public.resequence_packet_ids();

-- Create trigger for updated_at on updates
CREATE TRIGGER trigger_update_timestamp
    BEFORE UPDATE ON public.suns
    FOR EACH ROW
    EXECUTE FUNCTION public.set_packet_id();

-- Enable RLS (Row Level Security) if needed
-- ALTER TABLE public.suns ENABLE ROW LEVEL SECURITY;

-- Example usage:
-- INSERT INTO public.suns (rel_utg_id, rel_mrm_id) VALUES ('group1', 100);
-- INSERT INTO public.suns (rel_utg_id, rel_mrm_id) VALUES ('group1', 101);
-- INSERT INTO public.suns (rel_utg_id, rel_mrm_id) VALUES ('group2', 200);
-- 
-- This will create:
-- srs_global_id=1, srs_packet_id=1, rel_utg_id='group1', rel_mrm_id=100
-- srs_global_id=2, srs_packet_id=2, rel_utg_id='group1', rel_mrm_id=101  
-- srs_global_id=3, srs_packet_id=1, rel_utg_id='group2', rel_mrm_id=200
--
-- If you delete the first record from group1, the remaining record will be resequenced:
-- DELETE FROM public.suns WHERE srs_global_id = 1;
-- Result: srs_global_id=2 will have srs_packet_id=1 (resequenced from 2 to 1)