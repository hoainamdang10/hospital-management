-- Fix created_by column issue
-- Add created_by column to profiles table if it doesn't exist

DO $$ 
BEGIN
    -- Check if created_by column exists in profiles table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'created_by'
    ) THEN
        -- Add created_by column
        ALTER TABLE profiles ADD COLUMN created_by UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added created_by column to profiles table';
    ELSE
        RAISE NOTICE 'created_by column already exists in profiles table';
    END IF;
END $$;
