-- Add fields for individual day times and data collection to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN recurring_day_times JSONB DEFAULT NULL,
ADD COLUMN collect_data_enabled BOOLEAN DEFAULT false,
ADD COLUMN collect_data_label TEXT DEFAULT NULL,
ADD COLUMN collect_data_variable TEXT DEFAULT NULL,
ADD COLUMN collect_data_trigger TEXT DEFAULT NULL;

COMMENT ON COLUMN public.campaigns.recurring_day_times IS 'Stores individual times for each recurring day. Format: {"0": "09:00", "1": "14:00", "5": "10:30"}';
COMMENT ON COLUMN public.campaigns.collect_data_enabled IS 'Whether this campaign should collect custom data from users';
COMMENT ON COLUMN public.campaigns.collect_data_label IS 'The label/description of what data is being collected (e.g., "Time de Futebol")';
COMMENT ON COLUMN public.campaigns.collect_data_variable IS 'The variable name to use in messages (e.g., "times")';
COMMENT ON COLUMN public.campaigns.collect_data_trigger IS 'When/how this data should be collected (e.g., "quando responder sobre time favorito")';