-- price_events is the future valuation dataset: append-only, never edited or deleted.
CREATE OR REPLACE FUNCTION price_events_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'price_events is append-only (% blocked)', TG_OP;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER price_events_no_update_delete
  BEFORE UPDATE OR DELETE ON price_events
  FOR EACH ROW EXECUTE FUNCTION price_events_immutable();
--> statement-breakpoint
CREATE TRIGGER price_events_no_truncate
  BEFORE TRUNCATE ON price_events
  FOR EACH STATEMENT EXECUTE FUNCTION price_events_immutable();
