-- Create SQL view for joined api_key_slots and api_keys_t3 data
-- This view shows all publicly available slots with their associated user API keys

CREATE OR REPLACE VIEW public.sqlview_apikeysjoined1 AS
SELECT 
    -- api_key_slots columns (left side - primary entity)
    aks.slot_id,
    aks.slot_name,
    aks.m1name,
    aks.m1inuse,
    aks.m2name,
    aks.m2inuse,
    aks.m3name,
    aks.m3inuse,
    aks.created_at as slot_created_at,
    aks.updated_at as slot_updated_at,
    aks.fk_iservices_provider_id,
    aks.slot_publicly_shown,
    aks.fk_ai_model_id,
    aks.count_active_modules_on_slot,
    aks.is_ai_model,
    
    -- api_keys_t3 columns (right side - joined user data)
    akt3.api_key_id,
    akt3.fk_user_id,
    akt3.fk_slot_id,
    akt3.created_at as key_created_at,
    akt3.updated_at as key_updated_at,
    akt3.d_m1name,
    akt3.d_m2name,
    akt3.d_m3name,
    akt3.d_slot_name,
    akt3.d_user_email

FROM public.api_key_slots aks
LEFT JOIN public.api_keys_t3 akt3 ON aks.slot_id = akt3.fk_slot_id
WHERE aks.slot_publicly_shown = TRUE
ORDER BY aks.created_at DESC;

-- Grant appropriate permissions
GRANT SELECT ON public.sqlview_apikeysjoined1 TO authenticated;
GRANT SELECT ON public.sqlview_apikeysjoined1 TO anon;