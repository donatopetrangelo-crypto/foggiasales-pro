-- ============================================================
-- FOGGIASAL PRO - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- for geo queries

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE client_status AS ENUM (
  'da_contattare',
  'contattato',
  'richiamare',
  'cliente_acquisito',
  'non_interessato'
);

CREATE TYPE client_category AS ENUM (
  'horeca',
  'alimentari_retail',
  'medical_estetico',
  'altre_attivita'
);

CREATE TYPE alert_source AS ENUM (
  'google_maps',
  'social_media',
  'segnalazione',
  'registro_imprese'
);

-- ============================================================
-- TABLE: clients
-- ============================================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Anagrafica
  name TEXT NOT NULL,
  category client_category NOT NULL,
  subcategory TEXT,
  address TEXT,
  city TEXT NOT NULL,
  province TEXT DEFAULT 'FG',
  cap TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,

  -- Contatti
  phone TEXT,
  email TEXT,
  website TEXT,
  google_place_id TEXT UNIQUE,

  -- CRM
  status client_status DEFAULT 'da_contattare',
  value_score INTEGER DEFAULT 0 CHECK (value_score BETWEEN 0 AND 5),

  -- Metadata
  is_new_opening BOOLEAN DEFAULT FALSE,
  estimated_opening DATE,
  source TEXT DEFAULT 'manual',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for geo searches
CREATE INDEX idx_clients_city ON clients(city);
CREATE INDEX idx_clients_category ON clients(category);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_lat_lng ON clients(lat, lng);

-- ============================================================
-- TABLE: crm_entries (storico contatti)
-- ============================================================
CREATE TABLE crm_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  status client_status NOT NULL,
  notes TEXT,
  visit_type TEXT, -- 'chiamata', 'visita', 'email', 'whatsapp'
  visit_date TIMESTAMPTZ DEFAULT NOW(),
  next_action_date DATE,
  next_action_note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_client ON crm_entries(client_id);
CREATE INDEX idx_crm_agent ON crm_entries(agent_id);
CREATE INDEX idx_crm_date ON crm_entries(visit_date);

-- ============================================================
-- TABLE: new_opening_alerts
-- ============================================================
CREATE TABLE new_opening_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  business_name TEXT NOT NULL,
  category client_category,
  subcategory TEXT,
  address TEXT,
  city TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,

  source alert_source DEFAULT 'google_maps',
  source_url TEXT,
  estimated_opening DATE,
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score BETWEEN 0 AND 100),
  priority_score INTEGER DEFAULT 0 CHECK (priority_score BETWEEN 0 AND 5),

  added_to_crm BOOLEAN DEFAULT FALSE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: routes (giro commerciale)
-- ============================================================
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  client_ids UUID[] NOT NULL,
  optimized_order INTEGER[],
  total_distance_km DOUBLE PRECISION,
  estimated_duration_minutes INTEGER,
  status TEXT DEFAULT 'planned', -- planned, in_progress, completed

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: profiles (agenti)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'agent', -- agent, admin
  default_city TEXT DEFAULT 'Foggia',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can read/write their own data
CREATE POLICY "Authenticated can view clients" ON clients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can insert clients" ON clients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update clients" ON clients
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users own crm entries" ON crm_entries
  FOR ALL USING (agent_id = auth.uid() OR auth.role() = 'authenticated');

CREATE POLICY "Users own routes" ON routes
  FOR ALL USING (agent_id = auth.uid());

CREATE POLICY "Users own profile" ON profiles
  FOR ALL USING (id = auth.uid());

-- ============================================================
-- FUNCTION: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FUNCTION: update client status from CRM
-- ============================================================
CREATE OR REPLACE FUNCTION sync_client_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clients SET status = NEW.status, updated_at = NOW()
  WHERE id = NEW.client_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crm_sync_status
  AFTER INSERT ON crm_entries
  FOR EACH ROW EXECUTE FUNCTION sync_client_status();

-- ============================================================
-- SEED DATA: città provincia di Foggia
-- ============================================================
INSERT INTO clients (name, category, subcategory, address, city, phone, value_score, status) VALUES
  ('Pizzeria da Mario', 'horeca', 'pizzeria', 'Via Roma 12', 'Foggia', '0881123456', 4, 'da_contattare'),
  ('Bar Centrale', 'horeca', 'bar', 'Piazza Cavour 1', 'Manfredonia', '0884456789', 3, 'contattato'),
  ('Alimentari Russo', 'alimentari_retail', 'alimentari', 'Via Napoli 34', 'Vieste', '0884987654', 3, 'da_contattare'),
  ('Ristorante Il Gargano', 'horeca', 'ristorante', 'Lungomare 8', 'Peschici', '0884964321', 4, 'richiamare'),
  ('Pasticceria Dolce Vita', 'horeca', 'pasticceria', 'Corso Garibaldi 22', 'Lucera', '0881549870', 3, 'da_contattare'),
  ('Macelleria Fratelli Neri', 'alimentari_retail', 'macelleria', 'Via Mercato 5', 'San Giovanni Rotondo', '0882456123', 3, 'cliente_acquisito'),
  ('Centro Estetico Aurora', 'medical_estetico', 'centro_estetico', 'Via delle Ginestre 9', 'Monte Sant''Angelo', '0884562310', 2, 'da_contattare'),
  ('Sushi & More', 'horeca', 'sushi_takeaway', 'Via Corso Italia 88', 'Foggia', '0881774455', 5, 'da_contattare');
