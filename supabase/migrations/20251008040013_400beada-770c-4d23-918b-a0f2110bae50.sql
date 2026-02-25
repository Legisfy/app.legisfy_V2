-- Update invite_politico template to use {{link}} instead of {{token}}
UPDATE public.email_templates 
SET html_content = REPLACE(html_content, '{{token}}', '{{link}}'),
    updated_at = now()
WHERE type = 'invite_politico';