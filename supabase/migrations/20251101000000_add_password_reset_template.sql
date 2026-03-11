-- Adicionar template de redefinição de senha
INSERT INTO public.email_templates (type, name, subject, html_content, is_active)
VALUES (
  'password_reset',
  'Redefinição de Senha',
  'Legisfy 🔒 Recupere seu acesso',
  '<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Redefinir Senha – Legisfy</title>
  </head>
  <body style="margin:0; padding:0; background:#000000; font-family: system-ui, -apple-system, sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#000000; padding:40px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:600px; background:#09090b; border:1px solid rgba(255,255,255,0.05); border-radius:16px; overflow:hidden;">
            <tr>
              <td align="center" style="padding:40px 20px;">
                <img src="https://wvvxstgpjodmfxpekhkf.supabase.co/storage/v1/object/public/LEGISFY/legisfy%20branco.png" alt="Legisfy" width="140" style="display:block;">
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 40px 40px; text-align:center;">
                <h1 style="color:#ffffff; font-size:24px; font-weight:800; margin:0 0 16px 0;">Redefinir Senha</h1>
                <p style="color:rgba(255,255,255,0.5); font-size:15px; line-height:1.6; margin:0 0 32px 0;">
                  Olá! Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Legisfy</strong>.
                  Clique no botão abaixo para escolher uma nova senha.
                </p>
                
                <a href="{{link}}" style="display:inline-block; background:#ffffff; color:#000000; text-decoration:none; padding:14px 40px; border-radius:10px; font-weight:700; font-size:15px;">
                  Redefinir Senha →
                </a>
                
                <div style="margin-top:40px; padding:20px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; text-align:left;">
                  <p style="margin:0; color:rgba(255,255,255,0.3); font-size:12px; line-height:1.5;">
                    Se o botão não funcionar, copie este link: <br>
                    <span style="color:#3b82f6; word-break:break-all;">{{link}}</span>
                  </p>
                </div>
                
                <p style="margin:32px 0 0 0; color:rgba(255,255,255,0.2); font-size:12px;">
                  Este link é válido por 24 horas. Se você não solicitou esta alteração, pode ignorar este e-mail com segurança.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin-top:28px; color:rgba(255,255,255,0.15); font-size:11px; text-align:center;">
            © 2025 Legisfy · Mandato Inteligente
          </p>
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
