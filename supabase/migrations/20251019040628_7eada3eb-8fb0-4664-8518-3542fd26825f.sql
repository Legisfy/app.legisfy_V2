-- Inserir templates de email faltantes
-- Estes templates são usados pelas edge functions mas não existem no banco

-- Template de boas-vindas para político
INSERT INTO public.email_templates (name, type, subject, html_content, is_active, created_by)
VALUES (
  'Boas-vindas Político',
  'welcome_politico',
  '🎉 Bem-vindo à Legisfy, {{name}}!',
  '<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 40px 30px; }
        .content h2 { color: #2d3748; font-size: 22px; margin: 0 0 20px 0; }
        .content p { color: #4a5568; line-height: 1.6; margin: 0 0 15px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { color: #718096; font-size: 14px; margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Legisfy</h1>
        </div>
        <div class="content">
            <h2>Bem-vindo, {{name}}!</h2>
            <p>Seu gabinete <strong>{{cabinet}}</strong> foi criado com sucesso na plataforma Legisfy!</p>
            <p>Agora você pode gerenciar sua equipe, eleitores, demandas e muito mais em um só lugar.</p>
            <p>Para começar, acesse a plataforma e complete seu perfil.</p>
            <div style="text-align: center;">
                <a href="https://legisfy.app.br" class="button">Acessar Plataforma</a>
            </div>
        </div>
        <div class="footer">
            <p><strong>Legisfy</strong> - Gestão Parlamentar Inteligente</p>
            <p>© 2025 Legisfy. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>',
  true,
  (SELECT id FROM auth.users WHERE email IN (SELECT email FROM public.admin_emails) LIMIT 1)
)
ON CONFLICT (type) WHERE is_active = true DO UPDATE SET
  html_content = EXCLUDED.html_content,
  subject = EXCLUDED.subject,
  updated_at = now();

-- Template de boas-vindas para chefe de gabinete
INSERT INTO public.email_templates (name, type, subject, html_content, is_active, created_by)
VALUES (
  'Boas-vindas Chefe',
  'welcome_chefe',
  '🎯 Bem-vindo à equipe, {{name}}!',
  '<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 40px 30px; }
        .content h2 { color: #2d3748; font-size: 22px; margin: 0 0 20px 0; }
        .content p { color: #4a5568; line-height: 1.6; margin: 0 0 15px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { color: #718096; font-size: 14px; margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Legisfy</h1>
        </div>
        <div class="content">
            <h2>Bem-vindo, {{name}}!</h2>
            <p>Você foi adicionado como <strong>Chefe de Gabinete</strong>{{#if cabinet}} no {{cabinet}}{{/if}}!</p>
            <p>Como chefe, você terá acesso completo para gerenciar a equipe, delegar tarefas e acompanhar o desempenho.</p>
            <div style="text-align: center;">
                <a href="https://legisfy.app.br" class="button">Acessar Plataforma</a>
            </div>
        </div>
        <div class="footer">
            <p><strong>Legisfy</strong> - Gestão Parlamentar Inteligente</p>
            <p>© 2025 Legisfy. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>',
  true,
  (SELECT id FROM auth.users WHERE email IN (SELECT email FROM public.admin_emails) LIMIT 1)
)
ON CONFLICT (type) WHERE is_active = true DO UPDATE SET
  html_content = EXCLUDED.html_content,
  subject = EXCLUDED.subject,
  updated_at = now();

-- Template de boas-vindas para assessor
INSERT INTO public.email_templates (name, type, subject, html_content, is_active, created_by)
VALUES (
  'Boas-vindas Assessor',
  'welcome_assessor',
  '🚀 Bem-vindo à equipe, {{name}}!',
  '<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 40px 30px; }
        .content h2 { color: #2d3748; font-size: 22px; margin: 0 0 20px 0; }
        .content p { color: #4a5568; line-height: 1.6; margin: 0 0 15px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { color: #718096; font-size: 14px; margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Legisfy</h1>
        </div>
        <div class="content">
            <h2>Bem-vindo, {{name}}!</h2>
            <p>Você foi adicionado como <strong>Assessor</strong> no {{cabinet}}!</p>
            <p>Agora você pode começar a registrar eleitores, gerenciar demandas e contribuir com ideias para o gabinete.</p>
            <div style="text-align: center;">
                <a href="https://legisfy.app.br" class="button">Começar Agora</a>
            </div>
        </div>
        <div class="footer">
            <p><strong>Legisfy</strong> - Gestão Parlamentar Inteligente</p>
            <p>© 2025 Legisfy. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>',
  true,
  (SELECT id FROM auth.users WHERE email IN (SELECT email FROM public.admin_emails) LIMIT 1)
)
ON CONFLICT (type) WHERE is_active = true DO UPDATE SET
  html_content = EXCLUDED.html_content,
  subject = EXCLUDED.subject,
  updated_at = now();