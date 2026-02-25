-- Create email templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Add unique constraint for type (only one active template per type)
CREATE UNIQUE INDEX email_templates_active_type_unique 
ON public.email_templates (type) 
WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin can manage email templates" 
ON public.email_templates 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND main_role = 'admin_plataforma'::user_role_type
  )
);

CREATE POLICY "Everyone can read active templates" 
ON public.email_templates 
FOR SELECT 
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.email_templates (type, name, description, subject, html_content) VALUES 
(
  'invite_politico',
  'Convite para político criar gabinete',
  'Template padrão para convidar políticos',
  'Convite para criar seu gabinete no Legisfy',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bem-vindo ao Legisfy</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
    <h1 style="color: #2563eb; text-align: center;">Bem-vindo ao Legisfy!</h1>
    <p>Olá <strong>{{name}}</strong>,</p>
    <p>Você foi convidado para criar seu gabinete na plataforma Legisfy para a <strong>{{institution}}</strong>.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Aceitar Convite
      </a>
    </div>
    <p>Este convite expira em 7 dias.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="font-size: 12px; color: #666; text-align: center;">
      © 2024 Legisfy. Todos os direitos reservados.
    </p>
  </div>
</body>
</html>'
);