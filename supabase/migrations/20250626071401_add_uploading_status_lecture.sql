create extension if not exists "vector" with schema "public" version '0.8.0';

alter table "public"."lectures" alter column "status" drop default;

alter type "public"."lecture_status" rename to "lecture_status__old_version_to_be_dropped";

create type "public"."lecture_status" as enum ('uploading', 'uploaded', 'parsed', 'completed');

alter table "public"."lectures" alter column status type "public"."lecture_status" using status::text::"public"."lecture_status";

alter table "public"."lectures" alter column "status" set default 'uploaded'::lecture_status;

drop type "public"."lecture_status__old_version_to_be_dropped";


