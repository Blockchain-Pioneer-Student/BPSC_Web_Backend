-- CMS foundation for editable website sections.
-- The current BPSC_Web_Client is the design source of truth.
-- Run on PostgreSQL. The transaction keeps schema + seed changes atomic.

BEGIN;

CREATE TABLE IF NOT EXISTS site_content (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_site_content_visible
  ON site_content (is_visible);

CREATE TABLE IF NOT EXISTS recruitment_campaigns (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  opens_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  has_been_published BOOLEAN NOT NULL DEFAULT FALSE,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  external_form_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_recruitment_campaign_status
    CHECK (status IN ('draft', 'open', 'closed', 'archived')),
  CONSTRAINT ck_recruitment_campaign_dates
    CHECK (opens_at IS NULL OR closes_at IS NULL OR opens_at < closes_at),
  CONSTRAINT ck_recruitment_campaign_lifecycle
    CHECK (status = 'draft' OR has_been_published = TRUE)
);

-- Upgrade safety: before the durable lifecycle trigger exists, historical
-- draft rows cannot be proven to be never-published. Treat all campaigns that
-- already exist at that point conservatively as published. The trigger itself
-- is the one-time marker, so rerunning this migration later does not reclassify
-- drafts created under the hardened lifecycle.
DO $$
DECLARE
  lifecycle_column_exists BOOLEAN;
  lifecycle_trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'recruitment_campaigns'
      AND column_name = 'has_been_published'
  ) INTO lifecycle_column_exists;

  IF NOT lifecycle_column_exists THEN
    ALTER TABLE recruitment_campaigns
      ADD COLUMN has_been_published BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_recruitment_campaign_lifecycle'
      AND tgrelid = 'recruitment_campaigns'::regclass
      AND NOT tgisinternal
  ) INTO lifecycle_trigger_exists;

  IF NOT lifecycle_trigger_exists THEN
    ALTER TABLE recruitment_campaigns
      DROP CONSTRAINT IF EXISTS ck_recruitment_campaign_lifecycle;

    UPDATE recruitment_campaigns
    SET has_been_published = TRUE
    WHERE has_been_published = FALSE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_recruitment_campaign_status'
      AND conrelid = 'recruitment_campaigns'::regclass
  ) THEN
    ALTER TABLE recruitment_campaigns
      ADD CONSTRAINT ck_recruitment_campaign_status
      CHECK (status IN ('draft', 'open', 'closed', 'archived'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_recruitment_campaign_dates'
      AND conrelid = 'recruitment_campaigns'::regclass
  ) THEN
    ALTER TABLE recruitment_campaigns
      ADD CONSTRAINT ck_recruitment_campaign_dates
      CHECK (opens_at IS NULL OR closes_at IS NULL OR opens_at < closes_at);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_recruitment_campaign_lifecycle'
      AND conrelid = 'recruitment_campaigns'::regclass
  ) THEN
    ALTER TABLE recruitment_campaigns
      ADD CONSTRAINT ck_recruitment_campaign_lifecycle
      CHECK (status = 'draft' OR has_been_published = TRUE);
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION enforce_recruitment_campaign_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'draft' THEN
      NEW.has_been_published := TRUE;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.has_been_published = TRUE
       AND NEW.has_been_published = FALSE THEN
      RAISE EXCEPTION 'has_been_published cannot be reset'
        USING ERRCODE = '23514';
    END IF;

    IF NEW.status <> 'draft' THEN
      NEW.has_been_published := TRUE;
    END IF;

    IF OLD.status <> 'draft' AND NEW.status = 'draft' THEN
      RAISE EXCEPTION 'published campaigns cannot return to draft'
        USING ERRCODE = '23514';
    END IF;

    IF OLD.status = 'archived' AND NEW.status <> 'archived' THEN
      RAISE EXCEPTION 'archived campaigns are terminal'
        USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.has_been_published = TRUE THEN
      RAISE EXCEPTION 'published campaigns cannot be deleted'
        USING ERRCODE = '23514';
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_recruitment_campaign_lifecycle'
      AND tgrelid = 'recruitment_campaigns'::regclass
      AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER trg_recruitment_campaign_lifecycle
    BEFORE INSERT OR UPDATE OR DELETE ON recruitment_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION enforce_recruitment_campaign_lifecycle();
  END IF;
END
$$;

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS campaign_id INTEGER;

DO $$
DECLARE
  current_delete_rule TEXT;
BEGIN
  SELECT rc.delete_rule
    INTO current_delete_rule
  FROM information_schema.referential_constraints rc
  WHERE rc.constraint_schema = current_schema()
    AND rc.constraint_name = 'fk_registrations_campaign';

  IF current_delete_rule IS NULL THEN
    ALTER TABLE registrations
      ADD CONSTRAINT fk_registrations_campaign
      FOREIGN KEY (campaign_id)
      REFERENCES recruitment_campaigns(id)
      ON DELETE RESTRICT;
  ELSIF current_delete_rule <> 'RESTRICT' THEN
    ALTER TABLE registrations
      DROP CONSTRAINT fk_registrations_campaign;

    ALTER TABLE registrations
      ADD CONSTRAINT fk_registrations_campaign
      FOREIGN KEY (campaign_id)
      REFERENCES recruitment_campaigns(id)
      ON DELETE RESTRICT;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_registrations_campaign
  ON registrations (campaign_id);

CREATE INDEX IF NOT EXISTS idx_recruitment_campaigns_status
  ON recruitment_campaigns (status, is_visible);

CREATE UNIQUE INDEX IF NOT EXISTS uq_recruitment_single_visible_open
  ON recruitment_campaigns ((1))
  WHERE status = 'open' AND is_visible = TRUE;

ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

DO $$
DECLARE
  display_order_exists BOOLEAN;
  current_default TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'boards'
      AND column_name = 'display_order'
  ) INTO display_order_exists;

  IF NOT display_order_exists THEN
    ALTER TABLE boards
      ADD COLUMN display_order INTEGER NOT NULL DEFAULT 1000;

    UPDATE boards
    SET display_order = CASE name
      WHEN 'Advisory Board' THEN 10
      WHEN 'Executive Board' THEN 20
      WHEN 'Specialist Board' THEN 30
      WHEN 'Media Board' THEN 40
      WHEN 'Logistics Board' THEN 50
      WHEN 'External Relations Board' THEN 60
      ELSE 1000
    END;
  ELSE
    SELECT column_default
      INTO current_default
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'boards'
      AND column_name = 'display_order';

    -- Upgrade the round-2 default exactly once. Zero is treated as the old
    -- "unset" value; explicit non-zero admin ordering is preserved.
    IF current_default IS DISTINCT FROM '1000' THEN
      UPDATE boards
      SET display_order = CASE name
        WHEN 'Advisory Board' THEN 10
        WHEN 'Executive Board' THEN 20
        WHEN 'Specialist Board' THEN 30
        WHEN 'Media Board' THEN 40
        WHEN 'Logistics Board' THEN 50
        WHEN 'External Relations Board' THEN 60
        ELSE 1000
      END
      WHERE display_order = 0;

      ALTER TABLE boards
        ALTER COLUMN display_order SET DEFAULT 1000;
    END IF;
  END IF;
END
$$;

ALTER TABLE boards
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'pending';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_registration_status'
      AND conrelid = 'registrations'::regclass
  ) THEN
    ALTER TABLE registrations
      ADD CONSTRAINT ck_registration_status
      CHECK (status IN ('pending', 'approved', 'rejected', 'needs_info'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_registrations_status
  ON registrations (status);

-- Seed the current BPSC_Web_Client content. These defaults mirror the client
-- design committed on main and do not overwrite existing admin content.
INSERT INTO site_content (key, value, is_visible) VALUES
('branding', '{"site_name":"Blockchain Pioneer Student","header_logo_url":"/logo3.png","footer_logo_url":"/logo2.png","logo_alt":"Blockchain Pioneer Student Logo"}'::jsonb, TRUE),
('navigation', '{"home_label":"Home","home_url":"/","about_label":"About","about_url":"/about","events_label":"Events","events_url":"/events","news_label":"News","news_url":"/blogs","team_label":"Team","team_url":"/team","contact_label":"Contact","contact_url":"/contact","join_label":"Join Club","join_url":"/join"}'::jsonb, TRUE),
('home_hero', '{"eyebrow":"Vietnam''s pioneering Web3 student community","title":"Blockchain Pioneer Student","description":"Discover, learn, and grow with the Blockchain community at the University of Transport and Communications.","image_url":"/a8fd3637dcec6fb236fd.jpg","cta_label":"Join the club","cta_url":"/join"}'::jsonb, TRUE),
('home_intro', '{"title":"About Blockchain Pioneer Student Club","description":"The club brings together students passionate about Blockchain and Web3, creating an environment for learning, research, and hands-on practice with future-shaping technologies.","feature_1_title":"Learning","feature_1_description":"Workshops, seminars, and courses from fundamentals to advanced Blockchain & Web3.","feature_2_title":"Community","feature_2_description":"Connect with students, experts, and companies in the Blockchain space.","feature_3_title":"Hands-on","feature_3_description":"Join real-world projects, hackathons, and internship opportunities at top tech firms."}'::jsonb, TRUE),
('home_events', '{"title":"Featured activities","view_all_label":"View all events","view_all_url":"/events"}'::jsonb, TRUE),
('home_partners', '{"title":"Partners & Sponsors","view_all_label":"View all partners","view_all_url":"#"}'::jsonb, TRUE),
('home_cta', '{"title":"Ready to join us?","description":"Sign up today to become a member of the Blockchain Pioneer Student Club and start your journey exploring breakthrough technology!","primary_label":"Join the club","primary_url":"/join"}'::jsonb, TRUE),
('about_hero', '{"title":"About Blockchain Pioneer Student Club","subtitle":"A pioneering student club advancing Blockchain in Vietnam","cta_label":"Join us","cta_url":"/join"}'::jsonb, TRUE),
('about_mission', '{"title":"Our mission","description":"We are committed to building a high-quality learning and hands-on environment for students to master Blockchain. Through diverse activities, we aim to foster a vibrant, creative student community ready to embrace emerging technologies.","item_1":"Training from fundamentals to advanced Blockchain","item_2":"Organizing events and practical workshops","item_3":"Connecting with businesses and industry experts","item_4":"Creating internship and job opportunities"}'::jsonb, TRUE),
('about_vision', '{"title":"Vision","description":"To become a leading Blockchain club in Vietnam''s student community, nurturing young talents in Blockchain and Web3.","stat_1_number":"100+","stat_1_label":"Members","stat_2_number":"50+","stat_2_label":"Events","stat_3_number":"20+","stat_3_label":"Partners","stat_4_number":"20+","stat_4_label":"Projects"}'::jsonb, TRUE),
('about_values', '{"title":"Core values","value_1_title":"Learning","value_1_description":"Continuous learning and updating knowledge of Blockchain & Web3","value_2_title":"Community","value_2_description":"Building a supportive and collaborative environment","value_3_title":"Creativity","value_3_description":"Encouraging innovative thinking and creative solutions"}'::jsonb, TRUE),
('about_journey', '{"title":"Our journey","item_1_year":"04/2024","item_1_title":"Club founded","item_1_description":"Blockchain UTC Club officially founded","item_2_year":"06/2024","item_2_title":"Seminar","item_2_description":"Student entrepreneurship on Blockchain","item_3_year":"06/2024","item_3_title":"Workshop","item_3_description":"Web3 technology and Decentralized Identity (DID)","item_4_year":"07/2024","item_4_title":"Cardano Blockchain Hackathon 2024","item_4_description":"The club''s first hackathon co-organized with experts from the Cardano community","item_5_year":"10/2024","item_5_title":"Course organized","item_5_description":"Intensive Cardano Blockchain course — grasp Blockchain in 9 sessions","item_6_year":"03/2025","item_6_title":"Cardano Blockchain Hackathon 2025","item_6_description":"Hackathon for developers and students with 350,000,000 VND in prizes — a playground for creativity where ideas become reality"}'::jsonb, TRUE),
('about_cta', '{"title":"Ready to join us?","description":"Become part of the Blockchain UTC community and help us build the future of Blockchain technology","primary_label":"Join the club","primary_url":"/join","secondary_label":"Contact us","secondary_url":"/contact"}'::jsonb, TRUE),
('team_hero', '{"title":"Our team","description":"With dedicated members, we are building a strong Blockchain Pioneer Student community","view_more_label":"View more members"}'::jsonb, TRUE),
('events_page', '{"hero_title":"Blockchain Pioneer Student Events","hero_description":"Explore events, workshops, and hackathons about Blockchain and Web3","cta_title":"Want to organize an event with us?","cta_description":"Contact us to collaborate on Blockchain and Web3 events","primary_label":"Contact us","primary_url":"/contact","secondary_label":"Learn more","secondary_url":"/partners"}'::jsonb, TRUE),
('blogs_page', '{"hero_title":"News & Events","hero_description":"Stay updated with the latest news and activities of the Blockchain Pioneer Student Club"}'::jsonb, TRUE),
('join_hero', '{"title":"Join the Club","description":"Become a member of the Blockchain Pioneer Student Club and start your journey exploring breakthrough technology"}'::jsonb, TRUE),
('join_benefits', '{"title":"Why join the club?","description":"Joining the Blockchain Pioneer Student Club brings you opportunities to learn, grow, and connect.","item_1_title":"Learning & Growth","item_1_description":"Access the latest Blockchain & Web3 knowledge via workshops, seminars, and expert-led courses.","item_2_title":"Community & Networking","item_2_description":"Meet and connect with students, professionals, and companies in Blockchain and tech.","item_3_title":"Career opportunities","item_3_description":"Access internships, jobs, and real-world projects from our industry partners."}'::jsonb, TRUE),
('join_form', '{"title":"Registration","description":"Fill in the form below to apply for membership in the Blockchain Pioneer Student Club","closed_title":"Recruitment is currently closed","closed_description":"There is no active recruitment campaign right now. Please check back later.","submit_label":"Submit application"}'::jsonb, TRUE),
('join_faq', '{"title":"Frequently Asked Questions","q1":"Who can join the Blockchain Pioneer Student Club?","a1":"All students at the University of Transport and Communications can apply, regardless of faculty, major, or year.","q2":"Do I need prior Blockchain knowledge?","a2":"No. We welcome all passionate students. We offer courses and workshops from beginner to advanced levels.","q3":"What is the registration process?","a3":"Fill out the online application form. The board will review and may contact you for a short interview. You will receive the result via email.","q4":"Is there a membership fee?","a4":"There is a small annual membership fee to sustain activities and events. Fee waivers may be available for students in need."}'::jsonb, TRUE),
('contact_hero', '{"title":"Contact","description":"Connect with Blockchain Pioneer Student Club — we''re ready to listen and help"}'::jsonb, TRUE),
('contact_info', '{"title":"Contact information","address":"Blockchain Labs, University of Transport and Communications, 03 Cau Giay, Lang Ward, Hanoi, Vietnam","email":"blockchainutc@gmail.com","phone":"+84 325045633","connect_title":"Connect with us"}'::jsonb, TRUE),
('contact_location', '{"title":"Map","description":"Find your way to Blockchain Pioneer Student","map_embed_url":"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.9265586961897!2d105.7999313!3d21.028513!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab424a50fff9%3A0xbe3a7f3670c0a45f!2zVHLGsOG7nW5nIMSQYcyjaSBob8yjYyBHaWFvIHRob8yBbmcgVsOqzKNuIHRhzJlp!5e0!3m2!1svi!2s!4v1650123456789!5m2!1svi!2s","directions_label":"Get directions","directions_url":"https://goo.gl/maps/1234"}'::jsonb, TRUE),
('contact_faq', '{"title":"Frequently Asked Questions","q1":"Which days does the club usually operate?","a1":"We usually hold sessions on Wednesday evenings and Saturday mornings. Special events are announced on our media channels.","q2":"How can I join the club?","a2":"You can register via the online form on our website or contact the board directly via the provided email or phone number.","q3":"Do I need prior Blockchain knowledge?","a3":"No. We welcome all students passionate about Blockchain. We provide courses and workshops from beginner to advanced levels.","q4":"How to become a club partner?","a4":"Organizations interested in partnering can contact the board via email or fill out the contact form on our website."}'::jsonb, TRUE),
('footer', '{"description":"A pioneering student club advancing Blockchain in Vietnam.","quick_links_title":"Quick links","quick_about_label":"About","quick_about_url":"/about","quick_events_label":"Events","quick_events_url":"/events","quick_news_label":"News (Coming Soon)","quick_news_url":"#","quick_media_label":"Media (Coming Soon)","quick_media_url":"#","quick_partners_label":"Partners (Coming Soon)","quick_partners_url":"#","quick_team_label":"Team","quick_team_url":"/team","join_title":"Join","member_label":"Member","member_url":"/join","faq_label":"FAQ (Coming Soon)","faq_url":"#","contact_link_label":"Contact","contact_link_url":"/contact","contact_title":"Contact","copyright_text":"Blockchain Pioneer Student. All rights reserved."}'::jsonb, TRUE),
('socials', '{"facebook":"https://www.facebook.com/bpsclub.utc","linkedin":"https://www.linkedin.com/company/106421064/","telegram":"#","x":"https://x.com/bps_club","youtube":"https://www.youtube.com/@BlockchainPioneerStudent"}'::jsonb, TRUE)
ON CONFLICT (key) DO NOTHING;

-- Upgrade only the exact round-1 default. Admin-customized content is kept.
UPDATE site_content
SET value = jsonb_set(value, '{view_all_url}', '"#"'::jsonb, false),
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'home_partners'
  AND value = '{"title":"Partners & Sponsors","view_all_label":"View all partners","view_all_url":"/partners"}'::jsonb;

COMMIT;
