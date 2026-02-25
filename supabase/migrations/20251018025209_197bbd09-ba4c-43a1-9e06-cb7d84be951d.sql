-- Permitir que service role (edge functions) leiam templates ativos
CREATE POLICY "service_role_can_read_active_templates"
ON email_templates
FOR SELECT
TO service_role
USING (is_active = true);

-- Permitir que authenticated users leiam templates ativos (para preview, etc)
CREATE POLICY "authenticated_can_read_active_templates"
ON email_templates
FOR SELECT
TO authenticated
USING (is_active = true);