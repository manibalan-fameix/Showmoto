CREATE TYPE "public"."car_status" AS ENUM('draft', 'live', 'on_hold', 'sold', 'archived');--> statement-breakpoint
CREATE TYPE "public"."dealer_role" AS ENUM('owner', 'staff');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('test_drive', 'enquiry', 'hold');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'visited', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."media_angle" AS ENUM('front_three_quarter', 'rear_three_quarter', 'side_left', 'side_right', 'dashboard', 'odometer', 'front_seats', 'rear_seats', 'boot', 'engine_bay', 'tyres_front', 'tyres_rear');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('photo', 'video');--> statement-breakpoint
CREATE TYPE "public"."media_status" AS ENUM('pending', 'uploaded', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."price_event_type" AS ENUM('listed', 'price_changed', 'sold');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"email_verified" timestamp,
	"image" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "dealer_domains" (
	"dealer_id" uuid NOT NULL,
	"hostname" text NOT NULL,
	"verified_at" timestamp with time zone,
	CONSTRAINT "dealer_domains_hostname_unique" UNIQUE("hostname")
);
--> statement-breakpoint
CREATE TABLE "dealer_users" (
	"dealer_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "dealer_role" DEFAULT 'staff' NOT NULL,
	CONSTRAINT "dealer_users_dealer_id_user_id_pk" PRIMARY KEY("dealer_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "dealers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"logo_url" text,
	"theme" jsonb NOT NULL,
	"plan" text DEFAULT 'starter' NOT NULL,
	"city" text DEFAULT 'Chennai' NOT NULL,
	"phone" text,
	"business_hours" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dealers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"variant" text NOT NULL,
	"fuel" text NOT NULL,
	"transmission" text NOT NULL,
	"engine_cc" integer,
	"year_from" integer NOT NULL,
	"year_to" integer,
	"specs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"features" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"car_id" uuid NOT NULL,
	"kind" "media_kind" NOT NULL,
	"angle" "media_angle",
	"r2_key" text NOT NULL,
	"width" integer,
	"height" integer,
	"duration_sec" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "media_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"car_id" uuid NOT NULL,
	"session_hash" text NOT NULL,
	"referrer" text,
	"dwell_ms" integer,
	"max_scroll_pct" integer,
	"video_played" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" uuid NOT NULL,
	"variant_id" uuid,
	"reg_number" text,
	"reg_prefix" text,
	"year" integer NOT NULL,
	"km_driven" integer,
	"owner_count" integer,
	"fuel" text,
	"transmission" text,
	"colour" text,
	"asking_price" integer,
	"status" "car_status" DEFAULT 'draft' NOT NULL,
	"short_code" text NOT NULL,
	"slug" text NOT NULL,
	"rc_verified_at" timestamp with time zone,
	"insurance_valid_till" date,
	"hypothecation_cleared" boolean,
	"listed_at" timestamp with time zone,
	"sold_at" timestamp with time zone,
	"sold_price" integer,
	CONSTRAINT "cars_short_code_unique" UNIQUE("short_code"),
	CONSTRAINT "cars_dealer_slug_uq" UNIQUE("dealer_id","slug")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" uuid NOT NULL,
	"car_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"source" "lead_source" NOT NULL,
	"preferred_at" timestamp with time zone,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"utm" jsonb,
	"consent_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"car_id" uuid NOT NULL,
	"event" "price_event_type" NOT NULL,
	"price" integer NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rc_lookups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"car_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"raw_response" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rc_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"car_id" uuid NOT NULL,
	"lead_id" uuid,
	"stage" integer DEFAULT 1 NOT NULL,
	"stage_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"buyer_tracking_token" text NOT NULL,
	CONSTRAINT "rc_transfers_car_id_unique" UNIQUE("car_id"),
	CONSTRAINT "rc_transfers_buyer_tracking_token_unique" UNIQUE("buyer_tracking_token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_domains" ADD CONSTRAINT "dealer_domains_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_users" ADD CONSTRAINT "dealer_users_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_users" ADD CONSTRAINT "dealer_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_media" ADD CONSTRAINT "car_media_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_views" ADD CONSTRAINT "car_views_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cars" ADD CONSTRAINT "cars_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cars" ADD CONSTRAINT "cars_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_events" ADD CONSTRAINT "price_events_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_lookups" ADD CONSTRAINT "rc_lookups_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_transfers" ADD CONSTRAINT "rc_transfers_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_transfers" ADD CONSTRAINT "rc_transfers_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dealer_domains_dealer_idx" ON "dealer_domains" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "dealer_users_user_idx" ON "dealer_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "variants_make_model_idx" ON "variants" USING btree ("make","model");--> statement-breakpoint
CREATE INDEX "car_media_car_idx" ON "car_media" USING btree ("car_id","sort_order");--> statement-breakpoint
CREATE INDEX "car_views_car_idx" ON "car_views" USING btree ("car_id","created_at");--> statement-breakpoint
CREATE INDEX "cars_dealer_idx" ON "cars" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "cars_dealer_status_idx" ON "cars" USING btree ("dealer_id","status");--> statement-breakpoint
CREATE INDEX "leads_dealer_idx" ON "leads" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "leads_dealer_status_idx" ON "leads" USING btree ("dealer_id","status");--> statement-breakpoint
CREATE INDEX "leads_car_idx" ON "leads" USING btree ("car_id");--> statement-breakpoint
CREATE INDEX "price_events_car_idx" ON "price_events" USING btree ("car_id","at");--> statement-breakpoint
CREATE INDEX "rc_lookups_car_idx" ON "rc_lookups" USING btree ("car_id","fetched_at");