-- ===========================================
-- LEAD FINDER FIELDS MIGRATION
-- Adds fields for AI-powered lead discovery
-- ===========================================

-- Add new columns to leads table for Lead Finder functionality

-- Lead type classification (Investor, Property Manager, etc.)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type TEXT;

-- Company information
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company TEXT;

-- Full address
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address TEXT;

-- Website URL
ALTER TABLE leads ADD COLUMN IF NOT EXISTS website TEXT;

-- Social media links
ALTER TABLE leads ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS facebook TEXT;

-- Strategic tags array (Whale, Quick-Turn, Luxury, Commercial, Multi-Unit)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- AI confidence score (0-100)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS confidence_score INTEGER
  CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100));

-- Service need description (why they need the service)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS service_need TEXT;

-- Add constraint to validate lead_type values
ALTER TABLE leads ADD CONSTRAINT check_lead_type 
  CHECK (lead_type IS NULL OR lead_type IN (
    'Investor', 
    'Property Manager', 
    'HOA Manager', 
    'Homeowner', 
    'Commercial'
  ));

-- Index for lead type filtering
CREATE INDEX IF NOT EXISTS idx_leads_lead_type ON leads(lead_type);

-- Index for tags array (GIN index for array containment queries)
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING GIN(tags);

-- Index for company lookups
CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company);

-- Index for confidence score sorting
CREATE INDEX IF NOT EXISTS idx_leads_confidence_score ON leads(confidence_score);

-- Composite index for Lead Finder filtering
CREATE INDEX IF NOT EXISTS idx_leads_finder ON leads(lead_type, service_tier, pipeline_stage)
  WHERE status = 'active';

-- ===========================================
-- COMMENTS for documentation
-- ===========================================

COMMENT ON COLUMN leads.lead_type IS 'Type of lead: Investor, Property Manager, HOA Manager, Homeowner, Commercial';
COMMENT ON COLUMN leads.company IS 'Company name if the lead is a business';
COMMENT ON COLUMN leads.address IS 'Full street address including city, state, ZIP';
COMMENT ON COLUMN leads.website IS 'Website URL if available';
COMMENT ON COLUMN leads.instagram IS 'Instagram handle or URL';
COMMENT ON COLUMN leads.facebook IS 'Facebook page URL';
COMMENT ON COLUMN leads.tags IS 'Strategic tags: Whale, Quick-Turn, Luxury, Commercial, Multi-Unit';
COMMENT ON COLUMN leads.confidence_score IS 'AI confidence score from 0-100 for discovered leads';
COMMENT ON COLUMN leads.service_need IS 'Description of why the lead needs the service';
