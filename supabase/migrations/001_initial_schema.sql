-- ===========================================
-- MAJESTIC CONTRACTING DATABASE SCHEMA
-- Initial migration for lead management system
-- ===========================================

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- LEADS TABLE
-- Core table storing all lead information
-- ===========================================
CREATE TABLE leads (
  -- Primary key using UUID
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Contact information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- Location (Virginia-focused)
  location TEXT NOT NULL,           -- City/area name (e.g., "Fairfax")
  zip_code TEXT NOT NULL,           -- Virginia ZIPs: 20xxx, 22xxx, 23xxx
  county TEXT,                      -- Virginia county name
  state TEXT DEFAULT 'VA',          -- Should be 'VA' for valid leads
  
  -- Service details
  service_type TEXT NOT NULL,       -- One of 17 Majestic services
  service_tier INTEGER NOT NULL     -- 1=Epic, 2=Modernize, 3=Exterior, 4=Service
    CHECK (service_tier BETWEEN 1 AND 4),
  project_scope TEXT,               -- small, medium, large, enterprise
  estimated_value DECIMAL(12,2),    -- Project value in dollars
  
  -- Lead scoring and pipeline
  lead_score INTEGER DEFAULT 0      -- 0-100 based on tier, scope, etc.
    CHECK (lead_score BETWEEN 0 AND 100),
  pipeline_stage TEXT DEFAULT 'new' -- new, contacted, design_phase, quoted, closed
    CHECK (pipeline_stage IN ('new', 'contacted', 'design_phase', 'quoted', 'closed')),
  status TEXT DEFAULT 'active'      -- active, archived, converted, lost
    CHECK (status IN ('active', 'archived', 'converted', 'lost')),
  
  -- Notes and history
  notes TEXT,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  
  -- Discovery tracking (for Gemini integration)
  discovered_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast filtering by service tier
CREATE INDEX idx_leads_service_tier ON leads(service_tier);

-- Index for pipeline stage queries
CREATE INDEX idx_leads_pipeline_stage ON leads(pipeline_stage);

-- Index for status filtering
CREATE INDEX idx_leads_status ON leads(status);

-- Index for location-based queries (VA counties)
CREATE INDEX idx_leads_county ON leads(county);

-- Index for zip code lookups
CREATE INDEX idx_leads_zip_code ON leads(zip_code);

-- Composite index for common dashboard queries
CREATE INDEX idx_leads_dashboard ON leads(status, pipeline_stage, service_tier);

-- ===========================================
-- SERVICES TABLE
-- Lookup table for all Majestic service types
-- ===========================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,        -- Service name (e.g., "Kitchen Remodel")
  tier INTEGER NOT NULL             -- 1=Epic, 2=Modernize, 3=Exterior, 4=Service
    CHECK (tier BETWEEN 1 AND 4),
  category TEXT NOT NULL            -- Tier category name
);

-- Seed the services table with all 17 Majestic services
INSERT INTO services (name, tier, category) VALUES
  -- Tier 1: Epic (Whales) - High value, long-term
  ('New Construction', 1, 'Epic'),
  ('Full Renovation', 1, 'Epic'),
  ('Home Addition', 1, 'Epic'),
  
  -- Tier 2: Modernize (Core Revenue) - Bread and butter
  ('Kitchen Remodel', 2, 'Modernize'),
  ('Bathroom Remodel', 2, 'Modernize'),
  ('Basement Remodel', 2, 'Modernize'),
  ('Condo Renovation', 2, 'Modernize'),
  
  -- Tier 3: Exterior (Specialty) - Entry points
  ('Roofing', 3, 'Exterior'),
  ('Deck', 3, 'Exterior'),
  ('Concrete', 3, 'Exterior'),
  ('Siding', 3, 'Exterior'),
  ('Fence', 3, 'Exterior'),
  ('She-Shed', 3, 'Exterior'),
  
  -- Tier 4: Service (High Volume) - Quick turnaround
  ('Painting', 4, 'Service'),
  ('Drywall', 4, 'Service'),
  ('Flooring', 4, 'Service'),
  ('Windows/Doors', 4, 'Service');

-- ===========================================
-- PIPELINE STAGES HISTORY TABLE
-- Tracks lead progression through pipeline
-- ===========================================
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  stage TEXT NOT NULL
    CHECK (stage IN ('new', 'contacted', 'design_phase', 'quoted', 'closed')),
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast stage history lookups by lead
CREATE INDEX idx_pipeline_stages_lead_id ON pipeline_stages(lead_id);

-- ===========================================
-- UPDATED_AT TRIGGER
-- Automatically updates the updated_at timestamp
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- For future auth implementation
-- ===========================================

-- Enable RLS on all tables (policies can be added later)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (update when auth is added)
CREATE POLICY "Allow all operations on leads" ON leads
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow read on services" ON services
  FOR SELECT USING (true);

CREATE POLICY "Allow all operations on pipeline_stages" ON pipeline_stages
  FOR ALL USING (true) WITH CHECK (true);
