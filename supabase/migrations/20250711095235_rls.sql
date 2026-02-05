alter table "public"."chunks" enable row level security;

alter table "public"."courses" enable row level security;

alter table "public"."embeddings" enable row level security;

alter table "public"."explanations" enable row level security;

alter table "public"."lectures" enable row level security;

alter table "public"."notes" enable row level security;

alter table "public"."slide_images" enable row level security;

alter table "public"."slides" enable row level security;

alter table "public"."summaries" enable row level security;

alter table "public"."user_profiles" enable row level security;

create policy "Allow read access to chunks of own lectures"
on "public"."chunks"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM lectures
  WHERE ((lectures.id = chunks.lecture_id) AND (lectures.user_id = auth.uid())))));


create policy "Allow all access to own courses"
on "public"."courses"
as permissive
for all
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Allow read access to embeddings of own lectures"
on "public"."embeddings"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM lectures
  WHERE ((lectures.id = embeddings.lecture_id) AND (lectures.user_id = auth.uid())))));


create policy "Allow read access to explanations of own lectures"
on "public"."explanations"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM lectures
  WHERE ((lectures.id = explanations.lecture_id) AND (lectures.user_id = auth.uid())))));


create policy "Allow all access to own lectures"
on "public"."lectures"
as permissive
for all
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Allow all access to own notes"
on "public"."notes"
as permissive
for all
to public
using ((auth.uid() = user_id))
with check (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM lectures
  WHERE ((lectures.id = notes.lecture_id) AND (lectures.user_id = auth.uid()))))));


create policy "Allow read access to slide_images of own lectures"
on "public"."slide_images"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM lectures
  WHERE ((lectures.id = slide_images.lecture_id) AND (lectures.user_id = auth.uid())))));


create policy "Allow read access to slides of own lectures"
on "public"."slides"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM lectures
  WHERE ((lectures.id = slides.lecture_id) AND (lectures.user_id = auth.uid())))));


create policy "Allow read access to summaries of own lectures"
on "public"."summaries"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM lectures
  WHERE ((lectures.id = summaries.lecture_id) AND (lectures.user_id = auth.uid())))));


create policy "Allow all access to own profile"
on "public"."user_profiles"
as permissive
for all
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



