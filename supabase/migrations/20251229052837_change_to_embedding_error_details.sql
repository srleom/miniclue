alter table "public"."messages" drop constraint "messages_role_check";

alter table "public"."lectures" drop column "search_error_details";

alter table "public"."lectures" add column "embedding_error_details" jsonb;

alter table "public"."messages" add constraint "messages_role_check" CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying])::text[]))) not valid;

alter table "public"."messages" validate constraint "messages_role_check";


