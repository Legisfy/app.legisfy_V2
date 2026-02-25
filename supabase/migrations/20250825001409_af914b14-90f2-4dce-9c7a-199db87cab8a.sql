-- Ensure category icon is the emoji, avoiding textual 'Scale'
UPDATE demand_categories 
SET icon = '⚖️'
WHERE lower(name) like '%orientação jurid%';