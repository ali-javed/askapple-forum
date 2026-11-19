-- MVP: remove required categories from threads (AI-assisted categorization later).
-- Run after 0001_askapple_forum_schema.sql.

-- Drop the foreign key constraint on askapple_threads.category_id (name may vary).
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'askapple_threads'
      AND c.contype = 'f'
      AND c.conkey = ARRAY[
        (SELECT attnum FROM pg_attribute WHERE attrelid = t.oid AND attname = 'category_id')
      ]
  LOOP
    EXECUTE format('ALTER TABLE public.askapple_threads DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.askapple_threads
  ALTER COLUMN category_id DROP NOT NULL;

-- Optional: keep askapple_categories table/data for future use, but no longer required.
