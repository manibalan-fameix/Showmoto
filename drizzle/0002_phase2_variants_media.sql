ALTER TABLE "cars" ALTER COLUMN "year" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "car_media" ADD COLUMN "analysis" jsonb;--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "variants_natural_uq" UNIQUE("make","model","variant","fuel","transmission","year_from");--> statement-breakpoint
ALTER TABLE "car_media" ADD CONSTRAINT "car_media_r2key_uq" UNIQUE("r2_key");