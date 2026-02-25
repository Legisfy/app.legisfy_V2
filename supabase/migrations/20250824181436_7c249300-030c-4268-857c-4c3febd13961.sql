-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_entity_type TEXT, -- indicacoes, demandas, eleitores, ideias
  related_entity_id UUID,
  created_by_user_id UUID, -- quem causou a notificação
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Platform admins can manage all notifications
CREATE POLICY "Platform admins can manage notifications" 
ON public.notifications 
FOR ALL 
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- Function to create notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_related_entity_type TEXT DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL,
  p_created_by_user_id UUID DEFAULT NULL
) 
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, 
    title, 
    message, 
    type, 
    related_entity_type, 
    related_entity_id, 
    created_by_user_id
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_related_entity_type,
    p_related_entity_id,
    COALESCE(p_created_by_user_id, auth.uid())
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to handle indicacao status changes and create notifications
CREATE OR REPLACE FUNCTION public.notify_indicacao_status_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
  indicacao_record RECORD;
  author_name TEXT;
  updater_name TEXT;
BEGIN
  -- Get the indicacao details and author info
  SELECT i.*, p.full_name as author_name
  INTO indicacao_record
  FROM public.indicacoes i
  LEFT JOIN public.profiles p ON p.user_id = i.user_id
  WHERE i.id = NEW.indicacao_id;
  
  -- Get updater name
  SELECT full_name INTO updater_name
  FROM public.profiles
  WHERE user_id = NEW.user_id;
  
  -- Only notify if the status changer is different from the author
  IF NEW.user_id != indicacao_record.user_id THEN
    -- Create notification for the author
    PERFORM public.create_notification(
      indicacao_record.user_id,
      'Indicação Atualizada',
      format('Sua indicação "%s" foi %s por %s', 
        indicacao_record.titulo, 
        CASE NEW.status
          WHEN 'formalizada' THEN 'formalizada'
          WHEN 'protocolada' THEN 'protocolada'  
          WHEN 'pendente' THEN 'marcada como pendente'
          WHEN 'atendida' THEN 'atendida'
          ELSE 'atualizada'
        END,
        COALESCE(updater_name, 'um colega')
      ),
      CASE NEW.status
        WHEN 'atendida' THEN 'success'
        WHEN 'formalizada' THEN 'info'
        WHEN 'protocolada' THEN 'info'
        ELSE 'info'
      END,
      'indicacoes',
      NEW.indicacao_id,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for indicacao status changes
DROP TRIGGER IF EXISTS trigger_notify_indicacao_status_change ON public.indicacao_status_events;
CREATE TRIGGER trigger_notify_indicacao_status_change
  AFTER INSERT ON public.indicacao_status_events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_indicacao_status_change();

-- Add updated_at trigger
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();