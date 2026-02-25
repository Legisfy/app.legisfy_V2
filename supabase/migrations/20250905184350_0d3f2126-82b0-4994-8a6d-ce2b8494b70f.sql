-- Ensure we have the correct structure for testing
-- Add a test entry to politicos_autorizados if it doesn't exist
INSERT INTO public.politicos_autorizados (email, camara_id, is_active)
SELECT 'devlegisfy@gmail.com', c.id, true
FROM public.camaras c
WHERE c.nome ILIKE '%assembleia%' OR c.nome ILIKE '%câmara%'
LIMIT 1
ON CONFLICT (email, camara_id) DO UPDATE SET is_active = true;