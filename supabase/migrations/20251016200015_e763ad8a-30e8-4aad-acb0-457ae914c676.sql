-- Trigger para notificar quando support_tickets receber resposta
CREATE OR REPLACE FUNCTION public.notify_support_ticket_response()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Só notifica se a resposta foi adicionada/atualizada e não estava respondida antes
  IF NEW.response IS NOT NULL AND (OLD.response IS NULL OR OLD.response = '') THEN
    
    -- Criar notificação para o usuário que criou o ticket
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      related_entity_type,
      related_entity_id,
      is_read
    ) VALUES (
      NEW.user_id,
      'Resposta Recebida',
      'Seu ticket "' || SUBSTRING(NEW.subject, 1, 50) || '..." foi respondido: ' || SUBSTRING(NEW.response, 1, 100),
      'info',
      'support_ticket',
      NEW.id,
      false
    );
    
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não falha o update
    RAISE LOG 'Erro ao criar notificação para ticket %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Criar trigger para support_tickets
DROP TRIGGER IF EXISTS notify_support_response ON public.support_tickets;
CREATE TRIGGER notify_support_response
  AFTER UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_support_ticket_response();

-- Atualizar função existente para feedback_ouvidoria
DROP TRIGGER IF EXISTS notify_feedback_response_trigger ON public.feedback_ouvidoria;
CREATE TRIGGER notify_feedback_response_trigger
  AFTER UPDATE ON public.feedback_ouvidoria
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_feedback_response();