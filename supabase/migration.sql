-- ===========================================================================
--  Julia Stille — Mäklarplattform
--  Databasschema för Supabase (PostgreSQL)
--
--  Så här kör du:
--    1. Öppna ditt projekt på https://supabase.com
--    2. Gå till "SQL Editor" → "New query"
--    3. Klistra in hela den här filen och tryck "Run"
--    4. Kör sedan supabase/seed.sql om du vill ha exempeldata
--
--  Skriptet går att köra flera gånger utan att något går sönder.
--  Developed by Stilledev
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Uppräkningstyper
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'property_status') then
    create type property_status as enum
      ('kommande', 'till_salu', 'budgivning', 'sald', 'tillbakadragen');
  end if;

  if not exists (select 1 from pg_type where typname = 'property_type') then
    create type property_type as enum
      ('lagenhet', 'villa', 'radhus', 'fritidshus', 'tomt', 'gard', 'lokal');
  end if;

  if not exists (select 1 from pg_type where typname = 'contact_type') then
    create type contact_type as enum ('saljare', 'kopare', 'spekulant', 'ovrig');
  end if;

  if not exists (select 1 from pg_type where typname = 'contact_stage') then
    create type contact_stage as enum
      ('ny', 'kontaktad', 'mote_bokat', 'intag', 'uppdrag', 'avslutad');
  end if;

  if not exists (select 1 from pg_type where typname = 'viewing_type') then
    create type viewing_type as enum ('oppen', 'privat', 'digital');
  end if;

  if not exists (select 1 from pg_type where typname = 'bid_status') then
    create type bid_status as enum ('aktivt', 'hogsta', 'avslaget', 'accepterat');
  end if;

  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type task_status as enum ('att_gora', 'pagar', 'klar');
  end if;

  if not exists (select 1 from pg_type where typname = 'task_priority') then
    create type task_priority as enum ('lag', 'normal', 'hog');
  end if;

  if not exists (select 1 from pg_type where typname = 'document_category') then
    create type document_category as enum
      ('avtal', 'besiktning', 'planritning', 'foto', 'ekonomi', 'ovrigt');
  end if;

  if not exists (select 1 from pg_type where typname = 'template_category') then
    create type template_category as enum
      ('annons', 'mail', 'sms', 'checklista', 'social');
  end if;

  if not exists (select 1 from pg_type where typname = 'message_role') then
    create type message_role as enum ('user', 'assistant');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- profile — en rad, mäklarens egna uppgifter
-- ---------------------------------------------------------------------------
create table if not exists public.profile (
  id              text primary key default 'profile',
  name            text        not null default 'Julia Stille',
  title           text        not null default 'Registrerad fastighetsmäklare',
  agency          text        not null default 'Stille Mäkleri',
  email           text        not null default '',
  phone           text        not null default '',
  bio             text        not null default '',
  avatar_url      text        not null default '',
  commission_rate numeric(5,2) not null default 2.5,
  goal_sales      integer     not null default 24,
  goal_revenue    bigint      not null default 2400000,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- contacts — kunder, spekulanter och säljare
-- ---------------------------------------------------------------------------
create table if not exists public.contacts (
  id            uuid primary key default gen_random_uuid(),
  name          text          not null,
  email         text          not null default '',
  phone         text          not null default '',
  type          contact_type  not null default 'spekulant',
  stage         contact_stage not null default 'ny',
  source        text          not null default '',
  budget_min    bigint,
  budget_max    bigint,
  wanted_area   text          not null default '',
  notes         text          not null default '',
  tags          text[]        not null default '{}',
  property_id   uuid,
  last_contact  timestamptz,
  created_at    timestamptz   not null default now()
);

-- ---------------------------------------------------------------------------
-- properties — objekten
-- ---------------------------------------------------------------------------
create table if not exists public.properties (
  id             uuid primary key default gen_random_uuid(),
  title          text            not null,
  address        text            not null,
  postal_code    text            not null default '',
  city           text            not null default '',
  district       text            not null default '',
  type           property_type   not null default 'lagenhet',
  status         property_status not null default 'kommande',
  price          bigint          not null default 0,
  final_price    bigint,
  monthly_fee    integer         not null default 0,
  operating_cost integer         not null default 0,
  rooms          numeric(4,1)    not null default 1,
  living_area    numeric(7,1)    not null default 0,
  plot_area      numeric(9,1)    not null default 0,
  floor          text            not null default '',
  build_year     integer,
  description    text            not null default '',
  features       text[]          not null default '{}',
  image_url      text            not null default '',
  images         text[]          not null default '{}',
  seller_id      uuid references public.contacts (id) on delete set null,
  -- commission = mäklararvodet i kronor för det här objektet
  commission     bigint          not null default 0,
  listed_at      timestamptz,
  sold_at        timestamptz,
  created_at     timestamptz     not null default now()
);

-- contacts.property_id pekar tillbaka på properties
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'contacts_property_id_fkey'
  ) then
    alter table public.contacts
      add constraint contacts_property_id_fkey
      foreign key (property_id) references public.properties (id) on delete set null;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- viewings — visningar
-- ---------------------------------------------------------------------------
create table if not exists public.viewings (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid         not null references public.properties (id) on delete cascade,
  title       text         not null default '',
  start_at    timestamptz  not null,
  end_at      timestamptz  not null,
  type        viewing_type not null default 'oppen',
  notes       text         not null default '',
  attendees   integer      not null default 0,
  created_at  timestamptz  not null default now()
);

-- ---------------------------------------------------------------------------
-- bids — budgivning
-- ---------------------------------------------------------------------------
create table if not exists public.bids (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid        not null references public.properties (id) on delete cascade,
  contact_id  uuid        references public.contacts (id) on delete set null,
  bidder_name text        not null,
  amount      bigint      not null check (amount >= 0),
  bid_at      timestamptz not null default now(),
  status      bid_status  not null default 'aktivt',
  note        text        not null default '',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- tasks — att göra
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text          not null,
  description text          not null default '',
  due_at      timestamptz,
  priority    task_priority not null default 'normal',
  status      task_status   not null default 'att_gora',
  property_id uuid references public.properties (id) on delete cascade,
  contact_id  uuid references public.contacts (id) on delete set null,
  created_at  timestamptz   not null default now()
);

-- ---------------------------------------------------------------------------
-- documents — dokumentarkiv
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  name        text              not null,
  category    document_category not null default 'ovrigt',
  url         text              not null,
  size        bigint            not null default 0,
  mime        text              not null default 'application/octet-stream',
  property_id uuid references public.properties (id) on delete cascade,
  created_at  timestamptz       not null default now()
);

-- ---------------------------------------------------------------------------
-- notes — anteckningar
-- ---------------------------------------------------------------------------
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  body        text        not null,
  property_id uuid references public.properties (id) on delete cascade,
  contact_id  uuid references public.contacts (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- templates — textmallar
-- ---------------------------------------------------------------------------
create table if not exists public.templates (
  id         uuid primary key default gen_random_uuid(),
  title      text              not null,
  category   template_category not null default 'mail',
  body       text              not null default '',
  created_at timestamptz       not null default now()
);

-- ---------------------------------------------------------------------------
-- conversations + messages — Stille AI
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  title      text        not null default 'Ny konversation',
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid         not null references public.conversations (id) on delete cascade,
  role            message_role not null,
  content         text         not null,
  created_at      timestamptz  not null default now()
);

-- ---------------------------------------------------------------------------
-- Index
-- ---------------------------------------------------------------------------
create index if not exists idx_properties_status     on public.properties (status);
create index if not exists idx_properties_created    on public.properties (created_at desc);
create index if not exists idx_contacts_stage        on public.contacts (stage);
create index if not exists idx_contacts_property     on public.contacts (property_id);
create index if not exists idx_viewings_property     on public.viewings (property_id);
create index if not exists idx_viewings_start        on public.viewings (start_at);
create index if not exists idx_bids_property         on public.bids (property_id);
create index if not exists idx_bids_amount           on public.bids (property_id, amount desc);
create index if not exists idx_tasks_status          on public.tasks (status);
create index if not exists idx_tasks_due             on public.tasks (due_at);
create index if not exists idx_documents_property    on public.documents (property_id);
create index if not exists idx_documents_category    on public.documents (category);
create index if not exists idx_notes_property        on public.notes (property_id);
create index if not exists idx_templates_category    on public.templates (category);
create index if not exists idx_messages_conversation on public.messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Appen har ett eget lösenordsskydd (middleware + cookie) och pratar med
-- Supabase via service_role-nyckeln, som alltid går förbi RLS. Vi slår därför
-- på RLS och lämnar tabellerna utan publika policys — ingen kan läsa eller
-- skriva med anon-nyckeln.
-- ---------------------------------------------------------------------------
alter table public.profile       enable row level security;
alter table public.properties    enable row level security;
alter table public.contacts      enable row level security;
alter table public.viewings      enable row level security;
alter table public.bids          enable row level security;
alter table public.tasks         enable row level security;
alter table public.documents     enable row level security;
alter table public.notes         enable row level security;
alter table public.templates     enable row level security;
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

-- Vill du hellre köra appen enbart med anon-nyckeln (utan service_role)?
-- Avkommentera blocket nedan. Observera att nyckeln då ger full åtkomst till
-- datan för den som får tag i den — kör bara så om projektet är privat.
--
-- do $$
-- declare t text;
-- begin
--   foreach t in array array[
--     'profile','properties','contacts','viewings','bids','tasks',
--     'documents','notes','templates','conversations','messages'
--   ] loop
--     execute format(
--       'create policy "anon full access" on public.%I for all to anon using (true) with check (true);', t
--     );
--   end loop;
-- end
-- $$;

-- ---------------------------------------------------------------------------
-- Storage — bucket för dokument och bilder
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media laesbar for alla" on storage.objects;
create policy "media laesbar for alla"
  on storage.objects for select
  using (bucket_id = 'media');

-- ---------------------------------------------------------------------------
-- Grundrad i profile
-- ---------------------------------------------------------------------------
insert into public.profile (id, name, title, agency, email, phone, bio, commission_rate, goal_sales, goal_revenue)
values (
  'profile',
  'Julia Stille',
  'Registrerad fastighetsmäklare',
  'Stille Mäkleri',
  'julia@stillemakleri.se',
  '070-123 45 67',
  'Fastighetsmäklare med hjärtat i Stockholm. Jag jobbar personligt, noggrant och alltid med full transparens genom hela affären — från första värderingen till nycklarna i handen.',
  2.5,
  24,
  2400000
)
on conflict (id) do nothing;
