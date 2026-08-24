-- ====================================================================
-- OORVAR SUPABASE POSTGRESQL PRODUCTION DATABASE SCHEMA (FAIL-SAFE)
-- Copy and run this entire script in Supabase -> SQL Editor -> Run
-- ====================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT DEFAULT ('USR-' || substring(md5(random()::text) from 1 for 8)),
    user_id TEXT PRIMARY KEY, -- Phone number as primary key
    role TEXT NOT NULL DEFAULT 'farmer',
    name TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT 'Ludhiana',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Farms Table
CREATE TABLE IF NOT EXISTS public.farms (
    id TEXT PRIMARY KEY DEFAULT ('FARM-' || substring(md5(random()::text) from 1 for 6)),
    farmer_id TEXT NOT NULL,
    farmer_name TEXT NOT NULL,
    location TEXT NOT NULL,
    crop TEXT NOT NULL DEFAULT 'Paddy',
    farm_area NUMERIC NOT NULL DEFAULT 12,
    sowing_date TEXT DEFAULT '2026-07-20',
    predicted_harvest TEXT DEFAULT '16 Nov 2026',
    harvest_expected_in_days INTEGER DEFAULT 83,
    available_stubble_tons NUMERIC NOT NULL DEFAULT 22.2,
    status TEXT NOT NULL DEFAULT 'AVAILABLE',
    is_pre_harvest_listed BOOLEAN DEFAULT TRUE,
    is_manual_override BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bids Table
CREATE TABLE IF NOT EXISTS public.bids (
    id TEXT PRIMARY KEY DEFAULT ('BID-' || substring(md5(random()::text) from 1 for 6)),
    buyer_id TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    location TEXT NOT NULL,
    target_tons NUMERIC NOT NULL,
    offered_rate NUMERIC NOT NULL,
    radius_km NUMERIC DEFAULT 50,
    target_farmer_id TEXT,
    target_farm_id TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Pool Invitations Table
CREATE TABLE IF NOT EXISTS public.pool_invitations (
    id TEXT PRIMARY KEY DEFAULT ('INV-' || substring(md5(random()::text) from 1 for 6)),
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_location TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_farm_id TEXT,
    tonnage NUMERIC NOT NULL DEFAULT 20.0,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

-- 5. Contracts Table
CREATE TABLE IF NOT EXISTS public.contracts (
    id TEXT PRIMARY KEY DEFAULT ('CON-' || substring(md5(random()::text) from 1 for 8)),
    bid_id TEXT,
    farm_id TEXT,
    farmer_id TEXT NOT NULL,
    buyer_id TEXT NOT NULL,
    farmer_name TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    location TEXT NOT NULL,
    tonnage NUMERIC NOT NULL,
    rate_per_ton NUMERIC NOT NULL,
    total_value NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'CONFIRMED_PICKUP',
    is_pooled BOOLEAN DEFAULT FALSE,
    pooled_members JSONB DEFAULT '[]'::jsonb,
    pickup_date TEXT DEFAULT 'Scheduled Immediate Pickup',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public write profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read farms" ON public.farms;
DROP POLICY IF EXISTS "Allow public write farms" ON public.farms;
DROP POLICY IF EXISTS "Allow public read bids" ON public.bids;
DROP POLICY IF EXISTS "Allow public write bids" ON public.bids;
DROP POLICY IF EXISTS "Allow public read pool_invitations" ON public.pool_invitations;
DROP POLICY IF EXISTS "Allow public write pool_invitations" ON public.pool_invitations;
DROP POLICY IF EXISTS "Allow public read contracts" ON public.contracts;
DROP POLICY IF EXISTS "Allow public write contracts" ON public.contracts;

-- Create Open Access Policies for Web Application
CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public write profiles" ON public.profiles FOR ALL USING (true);

CREATE POLICY "Allow public read farms" ON public.farms FOR SELECT USING (true);
CREATE POLICY "Allow public write farms" ON public.farms FOR ALL USING (true);

CREATE POLICY "Allow public read bids" ON public.bids FOR SELECT USING (true);
CREATE POLICY "Allow public write bids" ON public.bids FOR ALL USING (true);

CREATE POLICY "Allow public read pool_invitations" ON public.pool_invitations FOR SELECT USING (true);
CREATE POLICY "Allow public write pool_invitations" ON public.pool_invitations FOR ALL USING (true);

CREATE POLICY "Allow public read contracts" ON public.contracts FOR SELECT USING (true);
CREATE POLICY "Allow public write contracts" ON public.contracts FOR ALL USING (true);
