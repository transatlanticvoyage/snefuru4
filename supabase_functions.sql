-- SQL functions for incrementing poke counters
-- Run these in your Supabase SQL editor

-- Function to increment success count
CREATE OR REPLACE FUNCTION increment_success_count(target_slot_id UUID, target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE api_keys_t3 
    SET poke_success_count = COALESCE(poke_success_count, 0) + 1
    WHERE fk_slot_id = target_slot_id AND fk_user_id = target_user_id
    RETURNING poke_success_count INTO new_count;
    
    RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to increment failure count  
CREATE OR REPLACE FUNCTION increment_failure_count(target_slot_id UUID, target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE api_keys_t3 
    SET poke_failure_count = COALESCE(poke_failure_count, 0) + 1
    WHERE fk_slot_id = target_slot_id AND fk_user_id = target_user_id
    RETURNING poke_failure_count INTO new_count;
    
    RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql;