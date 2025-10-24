-- 004_create_outbox_events.sql
-- Transactional Outbox for Scheduler integration (appointments_schema)

create table if not exists appointments_schema.outbox_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  payload_json jsonb not null,
  dedup_key text unique,
  status text not null default 'PENDING' check (status in ('PENDING','RESERVED','SENT','FAILED')),
  attempts int not null default 0,
  next_retry_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_outbox_status_retry on appointments_schema.outbox_events(status, next_retry_at);
create index if not exists idx_outbox_created_at on appointments_schema.outbox_events(created_at);

alter table appointments_schema.outbox_events enable row level security;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'appointments_schema' AND tablename = 'outbox_events' AND policyname = 'service_role_full_access'
  ) THEN
    EXECUTE 'drop policy service_role_full_access on appointments_schema.outbox_events';
  END IF;
END$$;

create policy service_role_full_access on appointments_schema.outbox_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function appointments_schema.claim_outbox_events(batch_size int)
returns setof appointments_schema.outbox_events
language sql
as $$
  with cte as (
    select ctid, id
    from appointments_schema.outbox_events
    where status = 'PENDING' and next_retry_at <= now()
    order by created_at
    limit batch_size
    for update skip locked
  )
  update appointments_schema.outbox_events t
  set status = 'RESERVED', updated_at = now()
  from cte
  where t.ctid = cte.ctid
  returning t.*;
$$;

