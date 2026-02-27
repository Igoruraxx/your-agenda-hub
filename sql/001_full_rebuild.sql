-- ═══════════════════════════════════════════════════════════════
-- FITPRO — FULL DATABASE REBUILD
-- Execute este SQL no Supabase SQL Editor
-- ATENÇÃO: Isso vai DROPAR todas as tabelas existentes!
-- ═══════════════════════════════════════════════════════════════

-- 1. DROP EVERYTHING
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;

DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.measurements CASCADE;
DROP TABLE IF EXISTS public.bioimpedance CASCADE;
DROP TABLE IF EXISTS public.evolution_photos CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- 2. CREATE ENUM
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 3. CREATE TABLES

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  avatar_url text,
  stripe_customer_id text,
  subscription_status text DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'canceled', 'past_due')),
  subscription_product_id text,
  subscription_end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text DEFAULT '',
  plan text DEFAULT 'monthly' CHECK (plan IN ('monthly', 'session', 'long_term')),
  value numeric DEFAULT 0,
  weekly_frequency integer DEFAULT 2,
  selected_days text[] DEFAULT '{}',
  selected_times text[] DEFAULT '{}',
  is_consulting boolean DEFAULT false,
  is_active boolean DEFAULT true,
  billing_day integer,
  share_token uuid DEFAULT gen_random_uuid(),
  plan_duration integer,
  total_value numeric,
  next_billing_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date date NOT NULL,
  time text NOT NULL,
  duration integer DEFAULT 60,
  session_done boolean DEFAULT false,
  muscle_groups text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.evolution_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date date NOT NULL,
  front_url text,
  side_url text,
  back_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.bioimpedance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date date NOT NULL,
  image_url text,
  weight numeric NOT NULL,
  body_fat_pct numeric NOT NULL,
  body_fat_kg numeric NOT NULL,
  muscle_mass numeric NOT NULL,
  visceral_fat numeric NOT NULL,
  lean_mass numeric NOT NULL,
  muscle_pct numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date date NOT NULL,
  weight numeric NOT NULL,
  height numeric NOT NULL,
  chest numeric DEFAULT 0,
  waist numeric DEFAULT 0,
  hip numeric DEFAULT 0,
  arm numeric DEFAULT 0,
  thigh numeric DEFAULT 0,
  calf numeric DEFAULT 0,
  sf_triceps numeric DEFAULT 0,
  sf_biceps numeric DEFAULT 0,
  sf_subscapular numeric DEFAULT 0,
  sf_suprailiac numeric DEFAULT 0,
  sf_abdominal numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  paid_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  month_ref text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 4. SECURITY DEFINER FUNCTION (avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. ENABLE RLS ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bioimpedance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- == profiles ==
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Allow insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- == user_roles ==
CREATE POLICY "Users read own role"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage all roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- == students ==
CREATE POLICY "Users CRUD own students"
  ON public.students FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all students"
  ON public.students FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read by share_token"
  ON public.students FOR SELECT TO anon
  USING (share_token IS NOT NULL);

-- == appointments ==
CREATE POLICY "Users CRUD own appointments"
  ON public.appointments FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- == evolution_photos ==
CREATE POLICY "Users CRUD own evolution_photos"
  ON public.evolution_photos FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- == bioimpedance ==
CREATE POLICY "Users CRUD own bioimpedance"
  ON public.bioimpedance FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- == measurements ==
CREATE POLICY "Users CRUD own measurements"
  ON public.measurements FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- == payments ==
CREATE POLICY "Users CRUD own payments"
  ON public.payments FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all payments"
  ON public.payments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. AUTO-CREATE PROFILE + ROLE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

-- 9. STORAGE BUCKETS (run only if not exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('evolution-photos', 'evolution-photos', false, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('bioimpedance-images', 'bioimpedance-images', false, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Users upload own evolution photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evolution-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own evolution photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'evolution-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own evolution photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'evolution-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own bioimpedance"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bioimpedance-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own bioimpedance"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'bioimpedance-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own bioimpedance"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'bioimpedance-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ═══════════════════════════════════════════
-- DONE! Para tornar um user admin, execute:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('USER_UUID_HERE', 'admin');
-- ═══════════════════════════════════════════
