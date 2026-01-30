-- Add address fields to profiles
ALTER TABLE public.profiles
ADD COLUMN address TEXT,
ADD COLUMN city TEXT,
ADD COLUMN zip_code TEXT;