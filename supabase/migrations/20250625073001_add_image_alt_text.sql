create extension if not exists "vector" with schema "public" version '0.8.0';

create type "public"."lecture_status" as enum ('uploaded', 'parsed', 'completed');

alter table "public"."chunks" drop column "is_image";

alter table "public"."chunks" add column "token_count" integer;

alter table "public"."embeddings" add column "metadata" jsonb not null default '{}'::jsonb;

alter table "public"."explanations" add column "metadata" jsonb not null default '{}'::jsonb;

alter table "public"."lectures" add column "completed_at" timestamp with time zone;

alter table "public"."lectures" alter column "status" set default 'uploaded'::lecture_status;

alter table "public"."lectures" alter column "status" set data type lecture_status using "status"::lecture_status;

alter table "public"."slide_images" drop column "caption";

alter table "public"."slide_images" add column "alt_text" text;

alter table "public"."slide_images" add column "image_hash" text not null;

alter table "public"."slide_images" add column "is_decorative" boolean not null default false;

alter table "public"."slide_images" add column "ocr_text" text;

CREATE UNIQUE INDEX idx_unique_default_course_per_user ON public.courses USING btree (user_id) WHERE is_default;


