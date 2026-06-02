-- DreamTales Database Schema
-- Run in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null unique,
  full_name text,
  stripe_customer_id text unique,
  subscription_plan text not null default 'free' check (subscription_plan in ('free', 'starter', 'family')),
  subscription_status text not null default 'inactive' check (subscription_status in ('active', 'canceled', 'past_due', 'trialing', 'inactive')),
  subscription_period_end timestamptz,
  stories_generated_this_month integer not null default 0,
  month_reset_at timestamptz not null default date_trunc('month', now()),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Children profiles
create table public.children (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  age integer check (age >= 1 and age <= 15),
  gender text not null default 'neutral' check (gender in ('boy', 'girl', 'neutral')),
  friends text[] not null default '{}',
  parents text[] not null default '{}',
  avatar_emoji text default '🧒',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Story preferences per child
create table public.story_preferences (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid not null references public.children(id) on delete cascade unique,
  genres text[] not null default '{"forest","princesses","superheroes"}',
  reading_length integer not null default 15 check (reading_length in (15, 30, 45)),
  delivery_time time not null default '19:30:00',
  timezone text not null default 'Europe/Prague',
  language text not null default 'cs' check (language in ('cs', 'en', 'sk')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Generated stories
create table public.stories (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid not null references public.children(id) on delete cascade,
  child_name text not null,
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  content text not null,
  genre text not null,
  genre_name text not null,
  reading_length integer not null default 15,
  pdf_url text,
  pdf_storage_path text,
  sent_at timestamptz,
  email_sent_to text,
  created_at timestamptz not null default now()
);

-- Stripe subscriptions
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan text not null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Email delivery log
create table public.email_deliveries (
  id uuid primary key default uuid_generate_v4(),
  story_id uuid not null references public.stories(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  email text not null,
  resend_email_id text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'bounced')),
  error_message text,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_children_user_id on public.children(user_id);
create index idx_stories_child_id on public.stories(child_id);
create index idx_stories_user_id on public.stories(user_id);
create index idx_stories_created_at on public.stories(created_at desc);
create index idx_story_preferences_child_id on public.story_preferences(child_id);
create index idx_email_deliveries_story_id on public.email_deliveries(story_id);

-- RLS (Row Level Security)
alter table public.users enable row level security;
alter table public.children enable row level security;
alter table public.story_preferences enable row level security;
alter table public.stories enable row level security;
alter table public.subscriptions enable row level security;
alter table public.email_deliveries enable row level security;

-- RLS Policies
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can view own children" on public.children
  for all using (auth.uid() = user_id);

create policy "Users can manage own story preferences" on public.story_preferences
  for all using (
    auth.uid() = (select user_id from public.children where id = child_id)
  );

create policy "Users can view own stories" on public.stories
  for select using (auth.uid() = user_id);

create policy "Service role can insert stories" on public.stories
  for insert with check (true);

create policy "Users can view own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Function to auto-create user profile after signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to reset monthly story count
create or replace function public.reset_monthly_stories()
returns void as $$
begin
  update public.users
  set stories_generated_this_month = 0,
      month_reset_at = date_trunc('month', now())
  where month_reset_at < date_trunc('month', now());
end;
$$ language plpgsql security definer;

-- View for daily story delivery queue
create or replace view public.daily_delivery_queue as
select
  c.id as child_id,
  c.name as child_name,
  c.age,
  c.gender,
  c.friends,
  c.parents,
  u.id as user_id,
  u.email as parent_email,
  u.full_name as parent_name,
  u.subscription_plan,
  u.subscription_status,
  sp.genres,
  sp.reading_length,
  sp.delivery_time,
  sp.timezone,
  sp.language
from public.children c
join public.users u on u.id = c.user_id
join public.story_preferences sp on sp.child_id = c.id
where
  c.active = true
  and sp.active = true
  and u.subscription_status in ('active', 'trialing')
  and (
    select count(*) from public.stories s
    where s.child_id = c.id
    and s.created_at >= date_trunc('day', now() at time zone sp.timezone)
  ) = 0;
