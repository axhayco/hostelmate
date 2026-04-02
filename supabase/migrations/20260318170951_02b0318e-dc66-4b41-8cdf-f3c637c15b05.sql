
-- ============================================
-- HostelMate Database Schema
-- ============================================

-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('guest', 'owner', 'admin');

-- 2. Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  profile_photo TEXT,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. User roles table (separate from profiles per security best practices)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 4. Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Hostels table
CREATE TABLE public.hostels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  vibe_type TEXT,
  amenities TEXT[] DEFAULT '{}',
  verified_status BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC(2,1) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID REFERENCES public.hostels(id) ON DELETE CASCADE NOT NULL,
  room_type TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  beds_available INTEGER NOT NULL DEFAULT 0,
  max_occupancy INTEGER NOT NULL DEFAULT 1
);

-- 7. Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hostel_id UUID REFERENCES public.hostels(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hostel_id UUID REFERENCES public.hostels(id) ON DELETE CASCADE NOT NULL,
  cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),
  staff_rating INTEGER CHECK (staff_rating BETWEEN 1 AND 5),
  location_rating INTEGER CHECK (location_rating BETWEEN 1 AND 5),
  atmosphere_rating INTEGER CHECK (atmosphere_rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID REFERENCES public.hostels(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 10. Chat messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID REFERENCES public.hostels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Enable RLS on all tables
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- Profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- User roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Hostels
CREATE POLICY "Hostels are viewable by everyone" ON public.hostels FOR SELECT USING (true);
CREATE POLICY "Owners can insert hostels" ON public.hostels FOR INSERT WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners can update own hostels" ON public.hostels FOR UPDATE USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can delete own hostels" ON public.hostels FOR DELETE USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- Rooms
CREATE POLICY "Rooms are viewable by everyone" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Owners can insert rooms" ON public.rooms FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.hostels WHERE id = hostel_id AND owner_id = auth.uid())
);
CREATE POLICY "Owners can update rooms" ON public.rooms FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.hostels WHERE id = hostel_id AND owner_id = auth.uid())
);
CREATE POLICY "Owners can delete rooms" ON public.rooms FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.hostels WHERE id = hostel_id AND owner_id = auth.uid())
);

-- Bookings
CREATE POLICY "Guests can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners can view hostel bookings" ON public.bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.hostels WHERE id = hostel_id AND owner_id = auth.uid())
);
CREATE POLICY "Admins can view all bookings" ON public.bookings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Guests can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Guests can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);

-- Reviews
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Guests can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Guests can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Guests can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Events
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Owners can create events" ON public.events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.hostels WHERE id = hostel_id AND owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Owners can update events" ON public.events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.hostels WHERE id = hostel_id AND owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Owners can delete events" ON public.events FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.hostels WHERE id = hostel_id AND owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);

-- Chat messages: time-gated access (5 days before check-in to 2 days after checkout)
CREATE POLICY "Booked users can view chat" ON public.chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.hostel_id = chat_messages.hostel_id
    AND bookings.user_id = auth.uid()
    AND bookings.status = 'confirmed'
    AND bookings.check_in - INTERVAL '5 days' <= now()
    AND bookings.check_out + INTERVAL '2 days' >= now()
  )
  OR EXISTS (SELECT 1 FROM public.hostels WHERE id = chat_messages.hostel_id AND owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Booked users can send chat" ON public.chat_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.hostel_id = chat_messages.hostel_id
      AND bookings.user_id = auth.uid()
      AND bookings.status = 'confirmed'
      AND bookings.check_in - INTERVAL '5 days' <= now()
      AND bookings.check_out + INTERVAL '2 days' >= now()
    )
    OR EXISTS (SELECT 1 FROM public.hostels WHERE id = chat_messages.hostel_id AND owner_id = auth.uid())
  )
);
CREATE POLICY "Owners and admins can delete chat" ON public.chat_messages FOR DELETE USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.hostels WHERE id = chat_messages.hostel_id AND owner_id = auth.uid())
);

-- ============================================
-- Indexes for search optimization
-- ============================================
CREATE INDEX idx_hostels_location ON public.hostels USING btree (location);
CREATE INDEX idx_hostels_rating ON public.hostels USING btree (rating);
CREATE INDEX idx_hostels_vibe_type ON public.hostels USING btree (vibe_type);
CREATE INDEX idx_rooms_price ON public.rooms USING btree (price);
CREATE INDEX idx_bookings_user ON public.bookings USING btree (user_id);
CREATE INDEX idx_bookings_hostel ON public.bookings USING btree (hostel_id);
CREATE INDEX idx_chat_messages_hostel ON public.chat_messages USING btree (hostel_id, created_at);
CREATE INDEX idx_reviews_hostel ON public.reviews USING btree (hostel_id);

-- ============================================
-- Enable Realtime for chat_messages
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- ============================================
-- Auto-create profile + default guest role on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'guest');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
