-- Inserir template 2fa_code (compatibilidade com versão antiga da função)
INSERT INTO public.email_templates (type, name, subject, html_content, is_active)
VALUES (
  '2fa_code',
  'Codigo 2FA (legacy)',
  'Legisfy 🔒 Seu código de autenticação',
  '<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Código 2FA – Legisfy</title>
    <style>
      @media (max-width:600px){
        .container{width:100% !important}
        .px{padding-left:20px !important;padding-right:20px !important}
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background:#f5f5f5;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      Seu código de autenticação: {{codigo}}. Expira em 5 minutos.
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f5f5;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" class="container"
                 style="width:600px; max-width:600px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
            <tr>
              <td align="center" style="background:linear-gradient(90deg, #ff6a00, #ee0979, #8e2de2, #4a00e0); background-color:#ff6a00; padding:20px;">
                <div style="font:700 18px system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#ffffff; letter-spacing:1px; text-transform:uppercase;">
                  Código de Autenticação
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:28px 24px 20px 24px;">
                <img src="https://legisfy.app.br/assets/legisfy-logo-Dkw2pE2e.png" alt="Legisfy" width="120" style="display:block; max-width:120px; height:auto;">
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:32px 24px 24px 24px;">
                <div style="font:400 15px/1.5 system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#333;">
                  Olá <strong>{{nome}}</strong>, use o código abaixo para concluir seu login.
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 24px;">
                <div style="font:400 13px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#666;">
                  Gabinete: <strong style="color:#333;">{{gabinete_name}}</strong>
                </div>
              </td>
            </tr>
            <tr>
              <td class="px" align="center" style="padding:24px 32px;">
                <div style="background:#f8f9fa; border:2px dashed #ddd; border-radius:12px; padding:20px;">
                  <div style="font:800 36px/1.3 ''SFMono-Regular'', Menlo, Consolas, ''Liberation Mono'', monospace; letter-spacing:8px; color:#000000; text-align:center;">
                    {{codigo}}
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 24px 16px 24px;">
                <div style="font:500 13px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#e74c3c;">
                  ⏱️ Este código expira em 5 minutos.
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 24px 20px 24px;">
                <div style="background:#f0f9ff; border-left:3px solid #3b82f6; border-radius:8px; padding:12px 16px;">
                  <div style="font:500 14px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#1e40af;">
                    🔒 Este código garante que seu acesso seja seguro.
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:32px 24px;">
                <div style="font:400 12px/1.65 system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#999; text-align:center;">
                  Se você não solicitou este código, ignore este email.<br>
                  Este código é exclusivo e de uso único.
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="border-top:1px solid #eee; padding:24px;">
                <div style="font:400 11px/1.5 system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#aaa; text-align:center;">
                  © 2025 Legisfy – Mandato Inteligente<br>
                  <a href="https://legisfy.app.br" style="color:#3b82f6; text-decoration:none;">legisfy.app.br</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>',
  true
)
ON CONFLICT (type) WHERE is_active = true 
DO UPDATE SET 
  html_content = EXCLUDED.html_content,
  subject = EXCLUDED.subject,
  updated_at = now();