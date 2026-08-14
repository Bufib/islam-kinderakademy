-- Privater Storage-Bucket für Akademiemedien.
insert into storage.buckets (id, name, public, file_size_limit)
values ('academy-media', 'academy-media', false, 52428800)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "Members can read academy media objects" on storage.objects;
drop policy if exists "Staff can upload academy media objects" on storage.objects;
drop policy if exists "Staff can update academy media objects" on storage.objects;
drop policy if exists "Staff can delete academy media objects" on storage.objects;

create policy "Members can read academy media objects"
on storage.objects
for select
to authenticated
using (bucket_id = 'academy-media');

create policy "Staff can upload academy media objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'academy-media'
  and public.is_academy_staff()
);

create policy "Staff can update academy media objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'academy-media'
  and public.is_academy_staff()
)
with check (
  bucket_id = 'academy-media'
  and public.is_academy_staff()
);

create policy "Staff can delete academy media objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'academy-media'
  and public.is_academy_staff()
);
