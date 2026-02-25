-- Remove the "orientação jurídica" tag from documents category if it exists
DELETE FROM demand_tags WHERE name = 'orientação jurídica' AND category_id IN (
  SELECT id FROM demand_categories WHERE name = 'documentos'
);

-- Create new "orientação jurídica" category
INSERT INTO demand_categories (name, icon) VALUES ('orientação jurídica', 'Scale');

-- Get the category ID and insert the new tags
INSERT INTO demand_tags (name, category_id) 
SELECT tag_name, cat.id 
FROM (
  VALUES 
    ('Direito trabalhista (rescisão, carteira assinada, direitos CLT)'),
    ('Direito previdenciário (INSS, aposentadoria, BPC, pensão)'),
    ('Direito de família (pensão alimentícia, guarda, divórcio)'),
    ('Orientação sobre benefícios sociais (auxílios, cadÚnico)'),
    ('Orientação sobre moradia (despejo, contratos de aluguel, usucapião)'),
    ('Orientação criminal (BO, medidas protetivas, violência doméstica)'),
    ('Orientação sobre documentos legais (procurações, certidões, registro civil)'),
    ('Orientação eleitoral (título, regularização, transferência de domicílio)')
) AS tags(tag_name)
CROSS JOIN (
  SELECT id FROM demand_categories WHERE name = 'orientação jurídica'
) AS cat;