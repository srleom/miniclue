create extension if not exists "vector" with schema "public" version '0.8.0';

create type "public"."slide_image_type" as enum ('decorative', 'content');

alter table "public"."chunks" drop constraint "chunks_lecture_id_fkey";

alter table "public"."chunks" drop constraint "chunks_lecture_id_slide_number_chunk_index_key";

alter table "public"."chunks" drop constraint "fk_chunks_slide";

alter table "public"."embeddings" drop constraint "embeddings_lecture_id_fkey";

alter table "public"."embeddings" drop constraint "fk_embeddings_chunk";

alter table "public"."explanations" drop constraint "explanations_lecture_id_fkey";

alter table "public"."explanations" drop constraint "explanations_lecture_id_slide_number_key";

alter table "public"."explanations" drop constraint "fk_explanations_slide";

alter table "public"."slide_images" drop constraint "fk_slide_images_slide";

alter table "public"."slide_images" drop constraint "slide_images_lecture_id_fkey";

alter table "public"."slide_images" drop constraint "slide_images_lecture_id_slide_number_image_index_key";

drop index if exists "public"."chunks_lecture_id_slide_number_chunk_index_key";

drop index if exists "public"."explanations_lecture_id_slide_number_key";

drop index if exists "public"."idx_chunks_lecture";

drop index if exists "public"."idx_embeddings_lecture_snap";

drop index if exists "public"."slide_images_lecture_id_slide_number_image_index_key";

alter table "public"."lectures" alter column "status" drop default;

alter type "public"."lecture_status" rename to "lecture_status__old_version_to_be_dropped";

create type "public"."lecture_status" as enum ('uploading', 'pending_processing', 'parsing', 'embedding', 'explaining', 'summarising', 'complete', 'failed');

create table "public"."decorative_images_global" (
    "image_hash" text not null,
    "storage_path" text not null,
    "first_seen_at" timestamp with time zone not null default now()
);


alter table "public"."lectures" alter column status type "public"."lecture_status" using status::text::"public"."lecture_status";

alter table "public"."lectures" alter column "status" set default 'uploading'::lecture_status;

drop type "public"."lecture_status__old_version_to_be_dropped";

alter table "public"."chunks" add column "slide_id" uuid not null;

alter table "public"."embeddings" add column "slide_id" uuid not null;

alter table "public"."explanations" add column "slide_id" uuid not null;

alter table "public"."lectures" drop column "processed_explanations";

alter table "public"."lectures" add column "processed_slides" integer not null default 0;

alter table "public"."slide_images" drop column "is_decorative";

alter table "public"."slide_images" add column "slide_id" uuid not null;

alter table "public"."slide_images" add column "type" slide_image_type not null default 'content'::slide_image_type;

alter table "public"."slides" drop column "pending_chunks_count";

alter table "public"."slides" add column "processed_chunks" integer not null default 0;

alter table "public"."slides" add column "total_chunks" integer not null default 0;

CREATE UNIQUE INDEX chunks_slide_id_chunk_index_key ON public.chunks USING btree (slide_id, chunk_index);

CREATE UNIQUE INDEX decorative_images_global_pkey ON public.decorative_images_global USING btree (image_hash);

CREATE UNIQUE INDEX explanations_slide_id_key ON public.explanations USING btree (slide_id);

CREATE INDEX idx_decorative_images_hash ON public.decorative_images_global USING btree (image_hash);

CREATE INDEX idx_embeddings_lecture_slide ON public.embeddings USING btree (lecture_id, slide_number);

CREATE UNIQUE INDEX slide_images_slide_id_image_index_key ON public.slide_images USING btree (slide_id, image_index);

alter table "public"."decorative_images_global" add constraint "decorative_images_global_pkey" PRIMARY KEY using index "decorative_images_global_pkey";

alter table "public"."chunks" add constraint "chunks_lecture_id_slide_number_fkey" FOREIGN KEY (lecture_id, slide_number) REFERENCES slides(lecture_id, slide_number) ON DELETE CASCADE not valid;

alter table "public"."chunks" validate constraint "chunks_lecture_id_slide_number_fkey";

alter table "public"."chunks" add constraint "chunks_slide_id_chunk_index_key" UNIQUE using index "chunks_slide_id_chunk_index_key";

alter table "public"."chunks" add constraint "chunks_slide_id_fkey" FOREIGN KEY (slide_id) REFERENCES slides(id) ON DELETE CASCADE not valid;

alter table "public"."chunks" validate constraint "chunks_slide_id_fkey";

alter table "public"."embeddings" add constraint "embeddings_chunk_id_fkey" FOREIGN KEY (chunk_id) REFERENCES chunks(id) ON DELETE CASCADE not valid;

alter table "public"."embeddings" validate constraint "embeddings_chunk_id_fkey";

alter table "public"."embeddings" add constraint "embeddings_lecture_id_slide_number_fkey" FOREIGN KEY (lecture_id, slide_number) REFERENCES slides(lecture_id, slide_number) ON DELETE CASCADE not valid;

alter table "public"."embeddings" validate constraint "embeddings_lecture_id_slide_number_fkey";

alter table "public"."embeddings" add constraint "embeddings_slide_id_fkey" FOREIGN KEY (slide_id) REFERENCES slides(id) ON DELETE CASCADE not valid;

alter table "public"."embeddings" validate constraint "embeddings_slide_id_fkey";

alter table "public"."explanations" add constraint "explanations_lecture_id_slide_number_fkey" FOREIGN KEY (lecture_id, slide_number) REFERENCES slides(lecture_id, slide_number) ON DELETE CASCADE not valid;

alter table "public"."explanations" validate constraint "explanations_lecture_id_slide_number_fkey";

alter table "public"."explanations" add constraint "explanations_slide_id_fkey" FOREIGN KEY (slide_id) REFERENCES slides(id) ON DELETE CASCADE not valid;

alter table "public"."explanations" validate constraint "explanations_slide_id_fkey";

alter table "public"."explanations" add constraint "explanations_slide_id_key" UNIQUE using index "explanations_slide_id_key";

alter table "public"."slide_images" add constraint "slide_images_lecture_id_slide_number_fkey" FOREIGN KEY (lecture_id, slide_number) REFERENCES slides(lecture_id, slide_number) ON DELETE CASCADE not valid;

alter table "public"."slide_images" validate constraint "slide_images_lecture_id_slide_number_fkey";

alter table "public"."slide_images" add constraint "slide_images_slide_id_fkey" FOREIGN KEY (slide_id) REFERENCES slides(id) ON DELETE CASCADE not valid;

alter table "public"."slide_images" validate constraint "slide_images_slide_id_fkey";

alter table "public"."slide_images" add constraint "slide_images_slide_id_image_index_key" UNIQUE using index "slide_images_slide_id_image_index_key";

grant delete on table "public"."decorative_images_global" to "anon";

grant insert on table "public"."decorative_images_global" to "anon";

grant references on table "public"."decorative_images_global" to "anon";

grant select on table "public"."decorative_images_global" to "anon";

grant trigger on table "public"."decorative_images_global" to "anon";

grant truncate on table "public"."decorative_images_global" to "anon";

grant update on table "public"."decorative_images_global" to "anon";

grant delete on table "public"."decorative_images_global" to "authenticated";

grant insert on table "public"."decorative_images_global" to "authenticated";

grant references on table "public"."decorative_images_global" to "authenticated";

grant select on table "public"."decorative_images_global" to "authenticated";

grant trigger on table "public"."decorative_images_global" to "authenticated";

grant truncate on table "public"."decorative_images_global" to "authenticated";

grant update on table "public"."decorative_images_global" to "authenticated";

grant delete on table "public"."decorative_images_global" to "service_role";

grant insert on table "public"."decorative_images_global" to "service_role";

grant references on table "public"."decorative_images_global" to "service_role";

grant select on table "public"."decorative_images_global" to "service_role";

grant trigger on table "public"."decorative_images_global" to "service_role";

grant truncate on table "public"."decorative_images_global" to "service_role";

grant update on table "public"."decorative_images_global" to "service_role";


