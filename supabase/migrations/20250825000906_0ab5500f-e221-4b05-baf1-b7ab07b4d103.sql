-- Fix the category name to remove "scale" prefix
UPDATE demand_categories 
SET name = '⚖️Orientação Juridica' 
WHERE name LIKE '%Orientação Juridica%' OR name LIKE '%orientação jurídica%';