create extension if not exists "vector" with schema "public" version '0.8.0';

alter table "public"."lectures" drop column "pdf_url";

alter table "public"."lectures" add column "storage_path" text not null default ''::text;


