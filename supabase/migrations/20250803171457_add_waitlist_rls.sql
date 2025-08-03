alter table "public"."waitlist" enable row level security;

create policy "Allow anyone to insert into waitlist"
on "public"."waitlist"
as permissive
for insert
to public
with check (true);



