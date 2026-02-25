-- Corrigir placeholders no template de convite político
UPDATE email_templates 
SET html_content = replace(html_content, '{{ .UserName }}', '{{name}}')
WHERE type = 'invite_politico' AND is_active = true;

UPDATE email_templates 
SET html_content = replace(html_content, '{{ .InstitutionName }}', '{{institution}}')
WHERE type = 'invite_politico' AND is_active = true;

UPDATE email_templates 
SET html_content = replace(html_content, '{{ .ConfirmationURL }}', '{{link}}')
WHERE type = 'invite_politico' AND is_active = true;

-- Atualizar timestamp para registrar a correção
UPDATE email_templates 
SET updated_at = now()
WHERE type = 'invite_politico' AND is_active = true;