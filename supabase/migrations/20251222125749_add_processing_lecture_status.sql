alter table "public"."messages" drop constraint "messages_role_check";

alter table "public"."lectures" alter column "status" drop default;

alter type "public"."lecture_status" rename to "lecture_status__old_version_to_be_dropped";

create type "public"."lecture_status" as enum ('uploading', 'pending_processing', 'parsing', 'processing', 'explaining', 'summarising', 'complete', 'failed');

alter table "public"."lectures" alter column status type "public"."lecture_status" using status::text::"public"."lecture_status";

alter table "public"."lectures" alter column "status" set default 'uploading'::public.lecture_status;

drop type "public"."lecture_status__old_version_to_be_dropped";

alter table "public"."messages" add constraint "messages_role_check" CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying])::text[]))) not valid;

alter table "public"."messages" validate constraint "messages_role_check";


