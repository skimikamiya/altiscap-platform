-- Create analyses table to store AI analysis results
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  input_data JSONB,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for security
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Policies: allow users to manage only their own rows
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'analyses' AND policyname = 'Users can view their own analyses'
  ) THEN
    CREATE POLICY "Users can view their own analyses"
    ON public.analyses
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'analyses' AND policyname = 'Users can insert their own analyses'
  ) THEN
    CREATE POLICY "Users can insert their own analyses"
    ON public.analyses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'analyses' AND policyname = 'Users can update their own analyses'
  ) THEN
    CREATE POLICY "Users can update their own analyses"
    ON public.analyses
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'analyses' AND policyname = 'Users can delete their own analyses'
  ) THEN
    CREATE POLICY "Users can delete their own analyses"
    ON public.analyses
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Timestamp trigger to keep updated_at current
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_analyses_updated_at'
  ) THEN
    CREATE TRIGGER update_analyses_updated_at
    BEFORE UPDATE ON public.analyses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;