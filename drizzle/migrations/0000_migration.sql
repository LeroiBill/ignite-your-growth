
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text,
  username text UNIQUE,
  avatar_url text,
  is_adult boolean NOT NULL DEFAULT false,
  age_confirmed_at timestamptz,
  lifetime_xp integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT username_format CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,20}$')
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles readable by signed-in users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.nights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  host_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visibility text NOT NULL DEFAULT 'invite' CHECK (visibility IN ('invite','friends')),
  status text NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby','live','ended')),
  started_at timestamptz,
  ended_at timestamptz,
  venue_count integer NOT NULL DEFAULT 0,
  drink_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX nights_host_idx ON public.nights(host_id);
CREATE INDEX nights_status_idx ON public.nights(status);

CREATE TABLE public.night_members (
  night_id uuid NOT NULL REFERENCES public.nights(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp integer NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (night_id, user_id)
);
CREATE INDEX night_members_user_idx ON public.night_members(user_id);

CREATE OR REPLACE FUNCTION public.is_night_member(_night_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.night_members WHERE night_id = _night_id AND user_id = _user_id)
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nights TO authenticated;
GRANT ALL ON public.nights TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.night_members TO authenticated;
GRANT ALL ON public.night_members TO service_role;
ALTER TABLE public.nights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.night_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view nights" ON public.nights FOR SELECT TO authenticated
  USING (host_id = auth.uid() OR public.is_night_member(id, auth.uid()));
CREATE POLICY "Users create nights they host" ON public.nights FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());
CREATE POLICY "Host updates night" ON public.nights FOR UPDATE TO authenticated USING (host_id = auth.uid());
CREATE POLICY "Host deletes night" ON public.nights FOR DELETE TO authenticated USING (host_id = auth.uid());

CREATE POLICY "Members view members" ON public.night_members FOR SELECT TO authenticated
  USING (public.is_night_member(night_id, auth.uid()));
CREATE POLICY "Users join as themselves" ON public.night_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users leave nights" ON public.night_members FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER nights_touch BEFORE UPDATE ON public.nights FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
