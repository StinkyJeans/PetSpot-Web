-- Add image/video support to direct messages

alter table public.messages
  add column if not exists media_url text,
  add column if not exists media_kind text check (media_kind in ('image', 'video'));

alter table public.messages
  drop constraint if exists messages_body_check;

alter table public.messages
  add constraint messages_body_or_media_check
  check (
    char_length(trim(coalesce(body, ''))) > 0
    or char_length(trim(coalesce(media_url, ''))) > 0
  );

