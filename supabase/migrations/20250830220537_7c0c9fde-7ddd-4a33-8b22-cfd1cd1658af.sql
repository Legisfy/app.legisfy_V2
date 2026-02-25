-- Remover vinculação incorreta do admin ao gabinete
DELETE FROM gabinete_members 
WHERE user_id = '47fc3dda-11d9-4375-9765-aa0bceb5d765';