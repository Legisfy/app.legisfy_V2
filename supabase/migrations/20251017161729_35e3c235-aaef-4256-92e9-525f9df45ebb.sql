-- Enable realtime for gabinetes table
ALTER TABLE public.gabinetes REPLICA IDENTITY FULL;

-- Add table to realtime publication (if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'gabinetes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.gabinetes;
  END IF;
END $$;