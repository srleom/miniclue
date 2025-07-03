create extension if not exists "vector" with schema "public" version '0.8.0';

alter table "public"."summaries" add column "metadata" jsonb not null default '{}'::jsonb;


