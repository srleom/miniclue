create extension if not exists "vector" with schema "public" version '0.8.0';

create type "public"."lecture_status" as enum ('uploading', 'pending_processing', 'parsing', 'explaining', 'summarising', 'complete', 'failed');

create type "public"."slide_image_type" as enum ('content', 'decorative', 'full_slide_render');

create table "public"."chunks" (
    "id" uuid not null default gen_random_uuid(),
    "slide_id" uuid not null,
    "lecture_id" uuid not null,
    "slide_number" integer not null,
    "chunk_index" integer not null,
    "text" text not null,
    "token_count" integer,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


create table "public"."courses" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "title" text not null,
    "description" text default ''::text,
    "is_default" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


create table "public"."embeddings" (
    "chunk_id" uuid not null,
    "slide_id" uuid not null,
    "lecture_id" uuid not null,
    "slide_number" integer not null,
    "vector" vector(1536) not null,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


create table "public"."explanations" (
    "id" uuid not null default gen_random_uuid(),
    "slide_id" uuid not null,
    "lecture_id" uuid not null,
    "slide_number" integer not null,
    "content" text not null,
    "one_liner" text not null default ''::text,
    "slide_type" text,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


create table "public"."lectures" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "course_id" uuid not null,
    "title" text not null,
    "storage_path" text not null default ''::text,
    "status" lecture_status not null default 'uploading'::lecture_status,
    "error_details" jsonb,
    "total_slides" integer not null default 0,
    "processed_slides" integer not null default 0,
    "total_sub_images" integer not null default 0,
    "processed_sub_images" integer not null default 0,
    "embeddings_complete" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "accessed_at" timestamp with time zone not null default now(),
    "completed_at" timestamp with time zone
);


create table "public"."notes" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "lecture_id" uuid not null,
    "content" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


create table "public"."slide_images" (
    "id" uuid not null default gen_random_uuid(),
    "slide_id" uuid not null,
    "lecture_id" uuid not null,
    "image_hash" text not null,
    "storage_path" text not null,
    "type" slide_image_type,
    "ocr_text" text,
    "alt_text" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


create table "public"."slides" (
    "id" uuid not null default gen_random_uuid(),
    "lecture_id" uuid not null,
    "slide_number" integer not null,
    "raw_text" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


create table "public"."summaries" (
    "lecture_id" uuid not null,
    "content" text not null,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


create table "public"."user_profiles" (
    "user_id" uuid not null,
    "name" text default ''::text,
    "email" text default ''::text,
    "avatar_url" text default ''::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


CREATE UNIQUE INDEX chunks_pkey ON public.chunks USING btree (id);

CREATE UNIQUE INDEX chunks_slide_id_chunk_index_key ON public.chunks USING btree (slide_id, chunk_index);

CREATE UNIQUE INDEX courses_pkey ON public.courses USING btree (id);

CREATE UNIQUE INDEX embeddings_pkey ON public.embeddings USING btree (chunk_id);

CREATE UNIQUE INDEX explanations_pkey ON public.explanations USING btree (id);

CREATE UNIQUE INDEX explanations_slide_id_key ON public.explanations USING btree (slide_id);

CREATE INDEX idx_chunks_lecture_slide ON public.chunks USING btree (lecture_id, slide_number);

CREATE INDEX idx_courses_user_id ON public.courses USING btree (user_id);

CREATE INDEX idx_embeddings_lecture_slide ON public.embeddings USING btree (lecture_id, slide_number);

CREATE INDEX idx_embeddings_vector ON public.embeddings USING ivfflat (vector) WITH (lists='100');

CREATE INDEX idx_explanations_lecture_slide ON public.explanations USING btree (lecture_id, slide_number);

CREATE INDEX idx_lectures_course_id ON public.lectures USING btree (course_id);

CREATE INDEX idx_lectures_user_id ON public.lectures USING btree (user_id);

CREATE INDEX idx_notes_lecture_id ON public.notes USING btree (lecture_id);

CREATE INDEX idx_notes_user_id ON public.notes USING btree (user_id);

CREATE INDEX idx_slide_images_lecture_hash ON public.slide_images USING btree (lecture_id, image_hash);

CREATE INDEX idx_slides_lecture_id ON public.slides USING btree (lecture_id);

CREATE INDEX idx_slides_lecture_slide ON public.slides USING btree (lecture_id, slide_number);

CREATE INDEX idx_summaries_by_lecture ON public.summaries USING btree (lecture_id);

CREATE UNIQUE INDEX idx_unique_default_course_per_user ON public.courses USING btree (user_id) WHERE is_default;

CREATE UNIQUE INDEX lectures_pkey ON public.lectures USING btree (id);

CREATE UNIQUE INDEX notes_pkey ON public.notes USING btree (id);

CREATE UNIQUE INDEX slide_images_pkey ON public.slide_images USING btree (id);

CREATE UNIQUE INDEX slides_lecture_id_slide_number_key ON public.slides USING btree (lecture_id, slide_number);

CREATE UNIQUE INDEX slides_pkey ON public.slides USING btree (id);

CREATE UNIQUE INDEX summaries_pkey ON public.summaries USING btree (lecture_id);

CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (user_id);

alter table "public"."chunks" add constraint "chunks_pkey" PRIMARY KEY using index "chunks_pkey";

alter table "public"."courses" add constraint "courses_pkey" PRIMARY KEY using index "courses_pkey";

alter table "public"."embeddings" add constraint "embeddings_pkey" PRIMARY KEY using index "embeddings_pkey";

alter table "public"."explanations" add constraint "explanations_pkey" PRIMARY KEY using index "explanations_pkey";

alter table "public"."lectures" add constraint "lectures_pkey" PRIMARY KEY using index "lectures_pkey";

alter table "public"."notes" add constraint "notes_pkey" PRIMARY KEY using index "notes_pkey";

alter table "public"."slide_images" add constraint "slide_images_pkey" PRIMARY KEY using index "slide_images_pkey";

alter table "public"."slides" add constraint "slides_pkey" PRIMARY KEY using index "slides_pkey";

alter table "public"."summaries" add constraint "summaries_pkey" PRIMARY KEY using index "summaries_pkey";

alter table "public"."user_profiles" add constraint "user_profiles_pkey" PRIMARY KEY using index "user_profiles_pkey";

alter table "public"."chunks" add constraint "chunks_lecture_id_slide_number_fkey" FOREIGN KEY (lecture_id, slide_number) REFERENCES slides(lecture_id, slide_number) ON DELETE CASCADE not valid;

alter table "public"."chunks" validate constraint "chunks_lecture_id_slide_number_fkey";

alter table "public"."chunks" add constraint "chunks_slide_id_chunk_index_key" UNIQUE using index "chunks_slide_id_chunk_index_key";

alter table "public"."chunks" add constraint "chunks_slide_id_fkey" FOREIGN KEY (slide_id) REFERENCES slides(id) ON DELETE CASCADE not valid;

alter table "public"."chunks" validate constraint "chunks_slide_id_fkey";

alter table "public"."courses" add constraint "courses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."courses" validate constraint "courses_user_id_fkey";

alter table "public"."embeddings" add constraint "embeddings_chunk_id_fkey" FOREIGN KEY (chunk_id) REFERENCES chunks(id) ON DELETE CASCADE not valid;

alter table "public"."embeddings" validate constraint "embeddings_chunk_id_fkey";

alter table "public"."embeddings" add constraint "embeddings_lecture_id_fkey" FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE not valid;

alter table "public"."embeddings" validate constraint "embeddings_lecture_id_fkey";

alter table "public"."embeddings" add constraint "embeddings_slide_id_fkey" FOREIGN KEY (slide_id) REFERENCES slides(id) ON DELETE CASCADE not valid;

alter table "public"."embeddings" validate constraint "embeddings_slide_id_fkey";

alter table "public"."explanations" add constraint "explanations_lecture_id_slide_number_fkey" FOREIGN KEY (lecture_id, slide_number) REFERENCES slides(lecture_id, slide_number) ON DELETE CASCADE not valid;

alter table "public"."explanations" validate constraint "explanations_lecture_id_slide_number_fkey";

alter table "public"."explanations" add constraint "explanations_slide_id_fkey" FOREIGN KEY (slide_id) REFERENCES slides(id) ON DELETE CASCADE not valid;

alter table "public"."explanations" validate constraint "explanations_slide_id_fkey";

alter table "public"."explanations" add constraint "explanations_slide_id_key" UNIQUE using index "explanations_slide_id_key";

alter table "public"."lectures" add constraint "lectures_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE not valid;

alter table "public"."lectures" validate constraint "lectures_course_id_fkey";

alter table "public"."lectures" add constraint "lectures_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."lectures" validate constraint "lectures_user_id_fkey";

alter table "public"."notes" add constraint "notes_lecture_id_fkey" FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE not valid;

alter table "public"."notes" validate constraint "notes_lecture_id_fkey";

alter table "public"."notes" add constraint "notes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."notes" validate constraint "notes_user_id_fkey";

alter table "public"."slide_images" add constraint "slide_images_lecture_id_fkey" FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE not valid;

alter table "public"."slide_images" validate constraint "slide_images_lecture_id_fkey";

alter table "public"."slide_images" add constraint "slide_images_slide_id_fkey" FOREIGN KEY (slide_id) REFERENCES slides(id) ON DELETE CASCADE not valid;

alter table "public"."slide_images" validate constraint "slide_images_slide_id_fkey";

alter table "public"."slides" add constraint "slides_lecture_id_fkey" FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE not valid;

alter table "public"."slides" validate constraint "slides_lecture_id_fkey";

alter table "public"."slides" add constraint "slides_lecture_id_slide_number_key" UNIQUE using index "slides_lecture_id_slide_number_key";

alter table "public"."summaries" add constraint "summaries_lecture_id_fkey" FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE not valid;

alter table "public"."summaries" validate constraint "summaries_lecture_id_fkey";

alter table "public"."user_profiles" add constraint "user_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_user_id_fkey";

grant delete on table "public"."chunks" to "anon";

grant insert on table "public"."chunks" to "anon";

grant references on table "public"."chunks" to "anon";

grant select on table "public"."chunks" to "anon";

grant trigger on table "public"."chunks" to "anon";

grant truncate on table "public"."chunks" to "anon";

grant update on table "public"."chunks" to "anon";

grant delete on table "public"."chunks" to "authenticated";

grant insert on table "public"."chunks" to "authenticated";

grant references on table "public"."chunks" to "authenticated";

grant select on table "public"."chunks" to "authenticated";

grant trigger on table "public"."chunks" to "authenticated";

grant truncate on table "public"."chunks" to "authenticated";

grant update on table "public"."chunks" to "authenticated";

grant delete on table "public"."chunks" to "service_role";

grant insert on table "public"."chunks" to "service_role";

grant references on table "public"."chunks" to "service_role";

grant select on table "public"."chunks" to "service_role";

grant trigger on table "public"."chunks" to "service_role";

grant truncate on table "public"."chunks" to "service_role";

grant update on table "public"."chunks" to "service_role";

grant delete on table "public"."courses" to "anon";

grant insert on table "public"."courses" to "anon";

grant references on table "public"."courses" to "anon";

grant select on table "public"."courses" to "anon";

grant trigger on table "public"."courses" to "anon";

grant truncate on table "public"."courses" to "anon";

grant update on table "public"."courses" to "anon";

grant delete on table "public"."courses" to "authenticated";

grant insert on table "public"."courses" to "authenticated";

grant references on table "public"."courses" to "authenticated";

grant select on table "public"."courses" to "authenticated";

grant trigger on table "public"."courses" to "authenticated";

grant truncate on table "public"."courses" to "authenticated";

grant update on table "public"."courses" to "authenticated";

grant delete on table "public"."courses" to "service_role";

grant insert on table "public"."courses" to "service_role";

grant references on table "public"."courses" to "service_role";

grant select on table "public"."courses" to "service_role";

grant trigger on table "public"."courses" to "service_role";

grant truncate on table "public"."courses" to "service_role";

grant update on table "public"."courses" to "service_role";

grant delete on table "public"."embeddings" to "anon";

grant insert on table "public"."embeddings" to "anon";

grant references on table "public"."embeddings" to "anon";

grant select on table "public"."embeddings" to "anon";

grant trigger on table "public"."embeddings" to "anon";

grant truncate on table "public"."embeddings" to "anon";

grant update on table "public"."embeddings" to "anon";

grant delete on table "public"."embeddings" to "authenticated";

grant insert on table "public"."embeddings" to "authenticated";

grant references on table "public"."embeddings" to "authenticated";

grant select on table "public"."embeddings" to "authenticated";

grant trigger on table "public"."embeddings" to "authenticated";

grant truncate on table "public"."embeddings" to "authenticated";

grant update on table "public"."embeddings" to "authenticated";

grant delete on table "public"."embeddings" to "service_role";

grant insert on table "public"."embeddings" to "service_role";

grant references on table "public"."embeddings" to "service_role";

grant select on table "public"."embeddings" to "service_role";

grant trigger on table "public"."embeddings" to "service_role";

grant truncate on table "public"."embeddings" to "service_role";

grant update on table "public"."embeddings" to "service_role";

grant delete on table "public"."explanations" to "anon";

grant insert on table "public"."explanations" to "anon";

grant references on table "public"."explanations" to "anon";

grant select on table "public"."explanations" to "anon";

grant trigger on table "public"."explanations" to "anon";

grant truncate on table "public"."explanations" to "anon";

grant update on table "public"."explanations" to "anon";

grant delete on table "public"."explanations" to "authenticated";

grant insert on table "public"."explanations" to "authenticated";

grant references on table "public"."explanations" to "authenticated";

grant select on table "public"."explanations" to "authenticated";

grant trigger on table "public"."explanations" to "authenticated";

grant truncate on table "public"."explanations" to "authenticated";

grant update on table "public"."explanations" to "authenticated";

grant delete on table "public"."explanations" to "service_role";

grant insert on table "public"."explanations" to "service_role";

grant references on table "public"."explanations" to "service_role";

grant select on table "public"."explanations" to "service_role";

grant trigger on table "public"."explanations" to "service_role";

grant truncate on table "public"."explanations" to "service_role";

grant update on table "public"."explanations" to "service_role";

grant delete on table "public"."lectures" to "anon";

grant insert on table "public"."lectures" to "anon";

grant references on table "public"."lectures" to "anon";

grant select on table "public"."lectures" to "anon";

grant trigger on table "public"."lectures" to "anon";

grant truncate on table "public"."lectures" to "anon";

grant update on table "public"."lectures" to "anon";

grant delete on table "public"."lectures" to "authenticated";

grant insert on table "public"."lectures" to "authenticated";

grant references on table "public"."lectures" to "authenticated";

grant select on table "public"."lectures" to "authenticated";

grant trigger on table "public"."lectures" to "authenticated";

grant truncate on table "public"."lectures" to "authenticated";

grant update on table "public"."lectures" to "authenticated";

grant delete on table "public"."lectures" to "service_role";

grant insert on table "public"."lectures" to "service_role";

grant references on table "public"."lectures" to "service_role";

grant select on table "public"."lectures" to "service_role";

grant trigger on table "public"."lectures" to "service_role";

grant truncate on table "public"."lectures" to "service_role";

grant update on table "public"."lectures" to "service_role";

grant delete on table "public"."notes" to "anon";

grant insert on table "public"."notes" to "anon";

grant references on table "public"."notes" to "anon";

grant select on table "public"."notes" to "anon";

grant trigger on table "public"."notes" to "anon";

grant truncate on table "public"."notes" to "anon";

grant update on table "public"."notes" to "anon";

grant delete on table "public"."notes" to "authenticated";

grant insert on table "public"."notes" to "authenticated";

grant references on table "public"."notes" to "authenticated";

grant select on table "public"."notes" to "authenticated";

grant trigger on table "public"."notes" to "authenticated";

grant truncate on table "public"."notes" to "authenticated";

grant update on table "public"."notes" to "authenticated";

grant delete on table "public"."notes" to "service_role";

grant insert on table "public"."notes" to "service_role";

grant references on table "public"."notes" to "service_role";

grant select on table "public"."notes" to "service_role";

grant trigger on table "public"."notes" to "service_role";

grant truncate on table "public"."notes" to "service_role";

grant update on table "public"."notes" to "service_role";

grant delete on table "public"."slide_images" to "anon";

grant insert on table "public"."slide_images" to "anon";

grant references on table "public"."slide_images" to "anon";

grant select on table "public"."slide_images" to "anon";

grant trigger on table "public"."slide_images" to "anon";

grant truncate on table "public"."slide_images" to "anon";

grant update on table "public"."slide_images" to "anon";

grant delete on table "public"."slide_images" to "authenticated";

grant insert on table "public"."slide_images" to "authenticated";

grant references on table "public"."slide_images" to "authenticated";

grant select on table "public"."slide_images" to "authenticated";

grant trigger on table "public"."slide_images" to "authenticated";

grant truncate on table "public"."slide_images" to "authenticated";

grant update on table "public"."slide_images" to "authenticated";

grant delete on table "public"."slide_images" to "service_role";

grant insert on table "public"."slide_images" to "service_role";

grant references on table "public"."slide_images" to "service_role";

grant select on table "public"."slide_images" to "service_role";

grant trigger on table "public"."slide_images" to "service_role";

grant truncate on table "public"."slide_images" to "service_role";

grant update on table "public"."slide_images" to "service_role";

grant delete on table "public"."slides" to "anon";

grant insert on table "public"."slides" to "anon";

grant references on table "public"."slides" to "anon";

grant select on table "public"."slides" to "anon";

grant trigger on table "public"."slides" to "anon";

grant truncate on table "public"."slides" to "anon";

grant update on table "public"."slides" to "anon";

grant delete on table "public"."slides" to "authenticated";

grant insert on table "public"."slides" to "authenticated";

grant references on table "public"."slides" to "authenticated";

grant select on table "public"."slides" to "authenticated";

grant trigger on table "public"."slides" to "authenticated";

grant truncate on table "public"."slides" to "authenticated";

grant update on table "public"."slides" to "authenticated";

grant delete on table "public"."slides" to "service_role";

grant insert on table "public"."slides" to "service_role";

grant references on table "public"."slides" to "service_role";

grant select on table "public"."slides" to "service_role";

grant trigger on table "public"."slides" to "service_role";

grant truncate on table "public"."slides" to "service_role";

grant update on table "public"."slides" to "service_role";

grant delete on table "public"."summaries" to "anon";

grant insert on table "public"."summaries" to "anon";

grant references on table "public"."summaries" to "anon";

grant select on table "public"."summaries" to "anon";

grant trigger on table "public"."summaries" to "anon";

grant truncate on table "public"."summaries" to "anon";

grant update on table "public"."summaries" to "anon";

grant delete on table "public"."summaries" to "authenticated";

grant insert on table "public"."summaries" to "authenticated";

grant references on table "public"."summaries" to "authenticated";

grant select on table "public"."summaries" to "authenticated";

grant trigger on table "public"."summaries" to "authenticated";

grant truncate on table "public"."summaries" to "authenticated";

grant update on table "public"."summaries" to "authenticated";

grant delete on table "public"."summaries" to "service_role";

grant insert on table "public"."summaries" to "service_role";

grant references on table "public"."summaries" to "service_role";

grant select on table "public"."summaries" to "service_role";

grant trigger on table "public"."summaries" to "service_role";

grant truncate on table "public"."summaries" to "service_role";

grant update on table "public"."summaries" to "service_role";

grant delete on table "public"."user_profiles" to "anon";

grant insert on table "public"."user_profiles" to "anon";

grant references on table "public"."user_profiles" to "anon";

grant select on table "public"."user_profiles" to "anon";

grant trigger on table "public"."user_profiles" to "anon";

grant truncate on table "public"."user_profiles" to "anon";

grant update on table "public"."user_profiles" to "anon";

grant delete on table "public"."user_profiles" to "authenticated";

grant insert on table "public"."user_profiles" to "authenticated";

grant references on table "public"."user_profiles" to "authenticated";

grant select on table "public"."user_profiles" to "authenticated";

grant trigger on table "public"."user_profiles" to "authenticated";

grant truncate on table "public"."user_profiles" to "authenticated";

grant update on table "public"."user_profiles" to "authenticated";

grant delete on table "public"."user_profiles" to "service_role";

grant insert on table "public"."user_profiles" to "service_role";

grant references on table "public"."user_profiles" to "service_role";

grant select on table "public"."user_profiles" to "service_role";

grant trigger on table "public"."user_profiles" to "service_role";

grant truncate on table "public"."user_profiles" to "service_role";

grant update on table "public"."user_profiles" to "service_role";


