-- Agregar columna emoji a la tabla Topics si no existe
ALTER TABLE "Topics" 
ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '📌';

-- Actualizar algunos temas con emojis de Apple
UPDATE "Topics" SET emoji = '💼' WHERE name ILIKE '%econom%' OR name ILIKE '%trabajo%';
UPDATE "Topics" SET emoji = '🏥' WHERE name ILIKE '%salud%';
UPDATE "Topics" SET emoji = '🎓' WHERE name ILIKE '%educac%' OR name ILIKE '%educacion%';
UPDATE "Topics" SET emoji = '🌱' WHERE name ILIKE '%ambiente%' OR name ILIKE '%medio%';
UPDATE "Topics" SET emoji = '⚖️' WHERE name ILIKE '%justicia%' OR name ILIKE '%derechos%';
UPDATE "Topics" SET emoji = '🏛️' WHERE name ILIKE '%democracia%' OR name ILIKE '%gobierno%';
UPDATE "Topics" SET emoji = '👥' WHERE name ILIKE '%social%' OR name ILIKE '%igualdad%';
UPDATE "Topics" SET emoji = '🔒' WHERE name ILIKE '%seguridad%';
UPDATE "Topics" SET emoji = '🌍' WHERE name ILIKE '%internacional%' OR name ILIKE '%relaciones%';
UPDATE "Topics" SET emoji = '💡' WHERE name ILIKE '%innovac%' OR name ILIKE '%tecnolog%';
UPDATE "Topics" SET emoji = '🏘️' WHERE name ILIKE '%vivienda%' OR name ILIKE '%urbano%';
UPDATE "Topics" SET emoji = '🚗' WHERE name ILIKE '%transporte%';
UPDATE "Topics" SET emoji = '🎨' WHERE name ILIKE '%cultura%';
UPDATE "Topics" SET emoji = '⚡' WHERE name ILIKE '%energia%';
UPDATE "Topics" SET emoji = '👴' WHERE name ILIKE '%pension%' OR name ILIKE '%jubilac%';
