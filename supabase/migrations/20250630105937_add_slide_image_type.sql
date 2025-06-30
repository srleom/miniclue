create extension if not exists "vector" with schema "public" version '0.8.0';

alter table "public"."slide_images" alter column "type" drop default;

alter type "public"."slide_image_type" rename to "slide_image_type__old_version_to_be_dropped";

create type "public"."slide_image_type" as enum ('decorative', 'content', 'slide_image');

alter table "public"."slide_images" alter column type type "public"."slide_image_type" using type::text::"public"."slide_image_type";

alter table "public"."slide_images" alter column "type" set default 'content'::slide_image_type;

drop type "public"."slide_image_type__old_version_to_be_dropped";


