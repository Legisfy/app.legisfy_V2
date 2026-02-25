-- Enable realtime for eleitores table
ALTER TABLE public.eleitores REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.eleitores;