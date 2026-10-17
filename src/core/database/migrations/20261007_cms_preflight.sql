-- CMS foundation preflight.
-- Run this read-only validation before applying 20261007_cms_foundation.sql
-- to an existing database. It raises an exception for states that would make
-- the migration unsafe and prints notices for conservative reconciliations.

DO $$
DECLARE
  invalid_campaigns INTEGER := 0;
  open_visible_campaigns INTEGER := 0;
  orphan_registrations INTEGER := 0;
  invalid_registration_statuses INTEGER := 0;
  historical_drafts INTEGER := 0;
  zero_order_boards INTEGER := 0;
BEGIN
  IF to_regclass('recruitment_campaigns') IS NOT NULL THEN
    SELECT count(*)
      INTO invalid_campaigns
    FROM recruitment_campaigns
    WHERE status NOT IN ('draft', 'open', 'closed', 'archived')
       OR (
         opens_at IS NOT NULL
         AND closes_at IS NOT NULL
         AND opens_at >= closes_at
       );

    IF invalid_campaigns > 0 THEN
      RAISE EXCEPTION
        'Preflight failed: % recruitment campaign row(s) have invalid status/date ranges',
        invalid_campaigns;
    END IF;

    SELECT count(*)
      INTO open_visible_campaigns
    FROM recruitment_campaigns
    WHERE status = 'open'
      AND is_visible = TRUE;

    IF open_visible_campaigns > 1 THEN
      RAISE EXCEPTION
        'Preflight failed: % campaigns are simultaneously open + visible',
        open_visible_campaigns;
    END IF;

    SELECT count(*)
      INTO historical_drafts
    FROM recruitment_campaigns
    WHERE status = 'draft';

    IF historical_drafts > 0 THEN
      RAISE NOTICE
        '% existing draft campaign(s) will be treated conservatively as previously published when the durable lifecycle trigger is introduced',
        historical_drafts;
    END IF;
  END IF;

  IF to_regclass('registrations') IS NOT NULL
     AND to_regclass('recruitment_campaigns') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = 'registrations'
         AND column_name = 'campaign_id'
     ) THEN
    SELECT count(*)
      INTO orphan_registrations
    FROM registrations r
    LEFT JOIN recruitment_campaigns c ON c.id = r.campaign_id
    WHERE r.campaign_id IS NOT NULL
      AND c.id IS NULL;

    IF orphan_registrations > 0 THEN
      RAISE EXCEPTION
        'Preflight failed: % registration row(s) reference a missing recruitment campaign',
        orphan_registrations;
    END IF;
  END IF;

  IF to_regclass('registrations') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = 'registrations'
         AND column_name = 'status'
     ) THEN
    SELECT count(*)
      INTO invalid_registration_statuses
    FROM registrations
    WHERE status NOT IN ('pending', 'approved', 'rejected', 'needs_info');

    IF invalid_registration_statuses > 0 THEN
      RAISE EXCEPTION
        'Preflight failed: % registration row(s) have an unsupported status',
        invalid_registration_statuses;
    END IF;
  END IF;

  IF to_regclass('boards') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = 'boards'
         AND column_name = 'display_order'
     ) THEN
    SELECT count(*)
      INTO zero_order_boards
    FROM boards
    WHERE display_order = 0;

    IF zero_order_boards > 0 THEN
      RAISE NOTICE
        '% board row(s) still use legacy display_order=0; migration will treat zero as unset and preserve all non-zero admin ordering',
        zero_order_boards;
    END IF;
  END IF;
END
$$;
