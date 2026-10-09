-- Tivzo initial schema. Apply to a new Supabase project as postgres.
-- No participant personal information or bearer secrets are readable anonymously.
begin;
create table public.organizations(id uuid primary key default gen_random_uuid(),name text not null check(length(name) between 1 and 100),owner_id uuid not null references auth.users(id),created_at timestamptz not null default now());
create index organizations_owner_idx on public.organizations(owner_id);
create table public.events(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),name text not null check(length(name) between 1 and 100),slug text unique not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),date date not null,time time not null,venue text not null check(length(venue) between 1 and 150),category text not null check(length(category)<=100),description text not null check(length(description)<=2000),accent text not null default 'orange' check(accent in ('orange','blue','green')),status text not null default 'draft' check(status in ('draft','published','closed')),capacity integer not null check(capacity between 1 and 10000),created_at timestamptz not null default now());
create index events_org_idx on public.events(organization_id);
create table public.event_staff(event_id uuid not null references public.events(id),user_id uuid not null references auth.users(id),primary key(event_id,user_id));
create index event_staff_user_idx on public.event_staff(user_id);
create table public.registrations(id uuid primary key default gen_random_uuid(),event_id uuid not null references public.events(id),name text not null check(length(name) between 1 and 100),email text not null check(length(email) between 3 and 254),token_hash text unique not null,request_key uuid not null unique,revoked boolean not null default false,created_at timestamptz not null default now());
create index registrations_event_idx on public.registrations(event_id,created_at desc,id);
create table public.check_ins(registration_id uuid primary key references public.registrations(id),event_id uuid not null references public.events(id),staff_id uuid not null references auth.users(id),checked_at timestamptz not null default now());
create index check_ins_event_idx on public.check_ins(event_id);
create table public.scan_receipts(staff_id uuid not null references auth.users(id),request_id uuid not null,event_id uuid not null references public.events(id),token_hash text not null,result jsonb,created_at timestamptz not null default now(),primary key(staff_id,request_id));
create table public.admission_limits(bucket text primary key,window_at bigint not null,hits integer not null);

create function public.owns_org(p_org uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.organizations o where o.id=p_org and o.owner_id=auth.uid())$$;
create function public.owns_event(p_event uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.events e join public.organizations o on o.id=e.organization_id where e.id=p_event and o.owner_id=auth.uid())$$;
create function public.can_scan(p_event uuid) returns boolean language sql stable security definer set search_path='' as $$select public.owns_event(p_event) or exists(select 1 from public.event_staff s where s.event_id=p_event and s.user_id=auth.uid())$$;
alter table public.organizations enable row level security;
alter table public.events enable row level security;
alter table public.event_staff enable row level security;
alter table public.registrations enable row level security;
alter table public.check_ins enable row level security;
alter table public.scan_receipts enable row level security;
alter table public.admission_limits enable row level security;
create policy org_read on public.organizations for select to authenticated using(owner_id=auth.uid());
create policy event_read on public.events for select to authenticated using(public.can_scan(id));
create policy event_insert on public.events for insert to authenticated with check(public.owns_org(organization_id));
create policy event_update on public.events for update to authenticated using(public.owns_org(organization_id)) with check(public.owns_org(organization_id));
create policy staff_read on public.event_staff for select to authenticated using(user_id=auth.uid() or public.owns_event(event_id));
create policy registrations_read on public.registrations for select to authenticated using(public.owns_event(event_id));
create policy checkins_read on public.check_ins for select to authenticated using(public.owns_event(event_id));
revoke all on public.organizations,public.events,public.event_staff,public.registrations,public.check_ins,public.scan_receipts,public.admission_limits from anon,authenticated;
grant select on public.organizations,public.events,public.event_staff,public.check_ins to authenticated;
grant select(id,event_id,name,email,revoked,created_at) on public.registrations to authenticated;
grant insert(organization_id,name,slug,date,time,venue,category,description,accent,status,capacity) on public.events to authenticated;
grant update(name,date,time,venue,category,description,accent,status) on public.events to authenticated;
-- Capacity is immutable through direct client writes; changing it needs a future guarded RPC.

create function public.create_workspace(p_name text) returns uuid language plpgsql security definer set search_path='' as $$declare v_id uuid;begin
 if auth.uid() is null then raise exception 'Sign in first.';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if exists(select 1 from public.organizations where owner_id=auth.uid()) then raise exception 'You already have a workspace.';end if;
 insert into public.organizations(name,owner_id) values(trim(p_name),auth.uid()) returning id into v_id;return v_id;end$$;
create function public.public_event(p_slug text) returns jsonb language sql stable security definer set search_path='' as $$select to_jsonb(e)-'organization_id'-'created_at' from public.events e where e.slug=p_slug and e.status='published'$$;
create function public.workspace_snapshot() returns jsonb language plpgsql stable security definer set search_path='' as $$declare v_org jsonb;v_events jsonb;begin
 if auth.uid() is null then raise exception 'Sign in first.';end if;
 select jsonb_build_object('id',o.id,'name',o.name,'role','organizer') into v_org from public.organizations o where o.owner_id=auth.uid() order by created_at limit 1;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.date),'[]'::jsonb) into v_events from (select e.*,(select count(*) from public.registrations r where r.event_id=e.id)::int registered,(select count(*) from public.check_ins c where c.event_id=e.id)::int checked from public.events e where public.can_scan(e.id))x;
 return jsonb_build_object('organization',v_org,'events',v_events);end$$;
create function public.list_guests(p_event_id uuid default null,p_query text default '',p_offset integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$declare v_data jsonb;begin
 if auth.uid() is null then raise exception 'Sign in first.';end if;
 if p_event_id is not null and not public.owns_event(p_event_id) then raise exception 'Organizer access required.';end if;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into v_data from (select r.id,r.event_id,r.name,r.email,r.created_at,c.checked_at from public.registrations r left join public.check_ins c on c.registration_id=r.id where public.owns_event(r.event_id) and (p_event_id is null or r.event_id=p_event_id) and (p_query='' or position(lower(left(p_query,100)) in lower(r.name||' '||r.email))>0) order by r.created_at desc,r.id limit 50 offset greatest(0,least(p_offset,100000)))x;return v_data;end$$;
create function public.add_event_staff(p_event_id uuid,p_email text) returns void language plpgsql security definer set search_path='' as $$declare v_user uuid;begin
 if not public.owns_event(p_event_id) then raise exception 'Organizer access required.';end if;
 select id into v_user from auth.users where lower(email)=lower(trim(p_email));if v_user is null then raise exception 'Ask the volunteer to create a Tivzo account first.';end if;
 insert into public.event_staff(event_id,user_id) values(p_event_id,v_user) on conflict do nothing;end$$;
create function public.list_event_staff(p_event_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$declare result jsonb;begin
 if not public.owns_event(p_event_id) then raise exception 'Organizer access required.';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',u.id,'email',u.email)),'[]'::jsonb) into result from public.event_staff s join auth.users u on u.id=s.user_id where s.event_id=p_event_id;return result;end$$;

-- Small admission counters, called by the registration server only.
-- Fixed buckets overwrite old windows instead of accumulating per-window rows.
create function public.take_admission(p_bucket text,p_seconds integer,p_limit integer) returns boolean language plpgsql security definer set search_path='' as $$declare v_window bigint;v_count int;begin
 v_window:=floor(extract(epoch from clock_timestamp())/p_seconds);
 insert into public.admission_limits(bucket,window_at,hits) values(p_bucket,v_window,1)
 on conflict(bucket) do update set window_at=excluded.window_at,hits=case when admission_limits.window_at=excluded.window_at then admission_limits.hits+1 else 1 end returning hits into v_count;
 return v_count<=p_limit;end$$;
create function public.registration_admission(p_event uuid) returns boolean language plpgsql security definer set search_path='' as $$begin
 if not exists(select 1 from public.events where id=p_event and status='published') then return false;end if;
 if not public.take_admission('registration-global',10,120) then return false;end if;
 return public.take_admission('event-'||p_event::text,10,80);end$$;

create function public.register_guest(p_event_id uuid,p_name text,p_email text,p_token text,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$declare v_event public.events%rowtype;v_old public.registrations%rowtype;v_id uuid;v_hash text;begin
 if p_token !~ '^[A-Za-z0-9_-]{43}$' then raise exception 'Invalid ticket secret.';end if;
 v_hash:=encode(sha256(convert_to(p_token,'UTF8')),'hex');
 -- Request lock protects retries even if a request key is reused across events.
 perform pg_advisory_xact_lock(hashtextextended(p_key::text,0));
 select * into v_old from public.registrations where request_key=p_key;
 if found then
  if v_old.event_id<>p_event_id or v_old.name<>trim(p_name) or v_old.email<>lower(trim(p_email)) or v_old.token_hash<>v_hash then raise exception 'Request key does not match the original registration.';end if;
  return jsonb_build_object('id',v_old.id,'replayed',true);
 end if;
 select * into v_event from public.events where id=p_event_id for update;
 if not found or v_event.status<>'published' then raise exception 'Registration is closed.';end if;
 if (select count(*) from public.registrations where event_id=p_event_id)>=v_event.capacity then raise exception 'This event is full.';end if;
 insert into public.registrations(event_id,name,email,token_hash,request_key) values(p_event_id,trim(p_name),lower(trim(p_email)),v_hash,p_key) returning id into v_id;
 return jsonb_build_object('id',v_id,'replayed',false);end$$;

-- Recover a committed registration using its original client-held secret, even after closure.
create function public.registration_receipt(p_event_id uuid,p_name text,p_email text,p_token text,p_key uuid) returns jsonb language sql stable security definer set search_path='' as $$select jsonb_build_object('id',r.id,'replayed',true) from public.registrations r where r.request_key=p_key and r.event_id=p_event_id and r.name=trim(p_name) and r.email=lower(trim(p_email)) and r.token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex')$$;
revoke execute on function public.registration_receipt(uuid,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.registration_receipt(uuid,text,text,text,uuid) to service_role;

create function public.check_in_ticket(p_event_id uuid,p_token text,p_request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$declare v_receipt public.scan_receipts%rowtype;v_guest public.registrations%rowtype;v_hash text;v_status text;v_time timestamptz;v_result jsonb;v_actor uuid:=auth.uid();begin
 if v_actor is null or not public.can_scan(p_event_id) then raise exception 'You are not assigned to this event.';end if;
 if p_token !~ '^[A-Za-z0-9_-]{43}$' then return jsonb_build_object('status','invalid');end if;
 v_hash:=encode(sha256(convert_to(p_token,'UTF8')),'hex');
 insert into public.scan_receipts(staff_id,request_id,event_id,token_hash) values(v_actor,p_request_id,p_event_id,v_hash) on conflict do nothing;
 select * into v_receipt from public.scan_receipts where staff_id=v_actor and request_id=p_request_id for update;
 if v_receipt.event_id<>p_event_id or v_receipt.token_hash<>v_hash then raise exception 'This scan request belongs to a different ticket.';end if;
 if v_receipt.result is not null then return v_receipt.result||jsonb_build_object('replayed',true);end if;
 -- Share-lock event so closing an event and checking in have a defined ordering.
 select status into v_status from public.events where id=p_event_id for share;
 if v_status<>'published' then v_result:=jsonb_build_object('status','closed');
 else
  select * into v_guest from public.registrations where token_hash=v_hash and event_id=p_event_id for update;
  if not found or v_guest.revoked then v_result:=jsonb_build_object('status','invalid');
  else
   insert into public.check_ins(registration_id,event_id,staff_id) values(v_guest.id,p_event_id,v_actor) on conflict(registration_id) do nothing returning checked_at into v_time;
   if found then v_result:=jsonb_build_object('status','approved','name',v_guest.name,'checked_at',v_time);
   else select checked_at into v_time from public.check_ins where registration_id=v_guest.id;v_result:=jsonb_build_object('status','used','name',v_guest.name,'checked_at',v_time);end if;
  end if;
 end if;
 update public.scan_receipts set result=v_result where staff_id=v_actor and request_id=p_request_id;return v_result||jsonb_build_object('replayed',false);end$$;

-- SECURITY DEFINER functions have no default public execution.
revoke execute on function public.owns_org(uuid),public.owns_event(uuid),public.can_scan(uuid),public.create_workspace(text),public.public_event(text),public.workspace_snapshot(),public.list_guests(uuid,text,integer),public.add_event_staff(uuid,text),public.list_event_staff(uuid),public.take_admission(text,integer,integer),public.registration_admission(uuid),public.register_guest(uuid,text,text,text,uuid),public.check_in_ticket(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.public_event(text) to anon,authenticated;
grant execute on function public.owns_org(uuid),public.owns_event(uuid),public.can_scan(uuid),public.create_workspace(text),public.workspace_snapshot(),public.list_guests(uuid,text,integer),public.add_event_staff(uuid,text),public.list_event_staff(uuid),public.check_in_ticket(uuid,text,uuid) to authenticated;
grant execute on function public.registration_admission(uuid),public.register_guest(uuid,text,text,text,uuid) to service_role;
-- Enable authorized dashboard updates. No token hash is exposed through client SELECT.
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  alter publication supabase_realtime add table public.registrations,public.check_ins;
 end if;
end $$;
commit;
