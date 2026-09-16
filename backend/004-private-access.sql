-- Apply after 003. Keeps earlier email-based records unchanged.
begin;
create table if not exists oracle_private.code_participants (
 id uuid primary key, course_id uuid not null references public.oracle_courses(id),
 worker_number integer not null, code_digest text not null unique check(length(code_digest)=64),
 active boolean not null default true, expires_at timestamptz not null default now()+interval '180 days',
 created_at timestamptz not null default now(), started_at timestamptz, reflection text, completed_at timestamptz,
 unique(course_id,worker_number)
);
create table if not exists oracle_private.code_sessions (
 digest text primary key check(length(digest)=64), participant_id uuid not null references oracle_private.code_participants(id),
 expires_at timestamptz not null default now()+interval '12 hours'
);
create table if not exists oracle_private.code_submissions (
 participant_id uuid not null references oracle_private.code_participants(id), task_id integer not null check(task_id between 1 and 9),
 result jsonb not null, submitted_at timestamptz not null default now(), primary key(participant_id,task_id)
);
create table if not exists oracle_private.code_dialogue (
 request_id uuid primary key, participant_id uuid not null references oracle_private.code_participants(id),
 message text not null check(char_length(message) between 10 and 1200), result jsonb,
 created_at timestamptz not null default clock_timestamp()
);
create index if not exists code_dialogue_created on oracle_private.code_dialogue(created_at);
create table if not exists oracle_private.code_login_limits (
 bucket text primary key, window_start timestamptz not null, attempts integer not null
);
-- Serializable global windows cannot be bypassed by changing IP or guessed code.
create or replace function public.code_login_budget() returns boolean language plpgsql security definer set search_path='' as $$
declare b text; span interval; cap integer; attempts integer; t timestamptz:=clock_timestamp();
begin
 foreach b in array array['minute','hour'] loop
  span:=case b when 'minute' then interval '1 minute' else interval '1 hour' end;
  cap:=case b when 'minute' then 120 else 1000 end;
  insert into oracle_private.code_login_limits values(b,t,1)
  on conflict(bucket) do update set attempts=case when oracle_private.code_login_limits.window_start<=t-span then 1 else least(oracle_private.code_login_limits.attempts+1,cap+1) end,
  window_start=case when oracle_private.code_login_limits.window_start<=t-span then t else oracle_private.code_login_limits.window_start end
  returning code_login_limits.attempts into attempts;
  if attempts>cap then return false; end if;
 end loop;
 return true;
end $$;

create or replace function public.code_login(p_digest text,p_session text) returns jsonb language plpgsql security definer set search_path='' as $$
declare p oracle_private.code_participants;
begin
 select cp.* into p from oracle_private.code_participants cp join public.oracle_courses c on c.id=cp.course_id
 where cp.code_digest=p_digest and cp.active and cp.expires_at>now() and c.active for update of cp;
 if not found then return jsonb_build_object('error','Code not recognized or unavailable. Check with your instructor.'); end if;
 if p_session is null or length(p_session)<>64 then raise exception 'Invalid session.'; end if;
 delete from oracle_private.code_sessions where expires_at<=now();
 insert into oracle_private.code_sessions(digest,participant_id) values(p_session,p.id);
 update oracle_private.code_participants set started_at=coalesce(started_at,now()) where id=p.id;
 return jsonb_build_object('participant_id',p.id,'worker_label','Worker '||lpad(p.worker_number::text,3,'0'),'course_id',p.course_id,'course_name',(select name from public.oracle_courses where id=p.course_id));
end $$;

create or replace function public.code_instructor(p_instructor uuid,p_action text,p_course uuid default null,p_items jsonb default null,p_participant uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare item jsonb; n integer; p oracle_private.code_participants; result jsonb:='[]'::jsonb; course_record public.oracle_courses;
begin
 if p_instructor is null or not exists(select 1 from public.oracle_courses where instructor_id=p_instructor) then raise exception 'Instructor access required.'; end if;
 if p_action='records' then
  return jsonb_build_object('courses',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'active',active) order by name),'[]'::jsonb) from public.oracle_courses where instructor_id=p_instructor),
  'records',(select coalesce(jsonb_agg(to_jsonb(q) order by q.course_name,q.worker_label),'[]'::jsonb) from (
   select cp.id participant_id,cp.course_id,c.name course_name,'Worker '||lpad(cp.worker_number::text,3,'0') worker_label,cp.active,cp.expires_at,cp.started_at,cp.completed_at,cp.reflection,
    (select count(*) from oracle_private.code_submissions s where s.participant_id=cp.id) tasks_completed,
    (select coalesce(jsonb_agg(jsonb_build_object('task',s.task_id,'response',s.result->>'response','submitted_at',s.submitted_at) order by s.task_id),'[]'::jsonb) from oracle_private.code_submissions s where s.participant_id=cp.id) responses,
    (select coalesce(jsonb_agg(jsonb_build_object('message',d.message,'reply',d.result->>'reply','source',d.result->>'source') order by d.created_at),'[]'::jsonb) from oracle_private.code_dialogue d where d.participant_id=cp.id) dialogue
   from oracle_private.code_participants cp join public.oracle_courses c on c.id=cp.course_id where c.instructor_id=p_instructor
  )q));
 end if;
 select * into course_record from public.oracle_courses where id=p_course and instructor_id=p_instructor for update;
 if not found then raise exception 'Class unavailable.'; end if;
 if p_action='create' then
  if not course_record.active then raise exception 'This class is closed.'; end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 100 then raise exception 'Generate 1–100 codes at a time.'; end if;
  select coalesce(max(worker_number),0) into n from oracle_private.code_participants where course_id=p_course;
  for item in select value from jsonb_array_elements(p_items) loop
   -- Retrying a batch with the same IDs returns its original labels.
   select * into p from oracle_private.code_participants where id=(item->>'id')::uuid;
   if found then
    if p.course_id<>p_course or p.code_digest<>item->>'digest' then raise exception 'Batch conflict. Refresh and try again.'; end if;
   else
    n:=n+1;
    if n>999 then raise exception 'Class code limit reached.'; end if;
    insert into oracle_private.code_participants(id,course_id,worker_number,code_digest) values((item->>'id')::uuid,p_course,n,item->>'digest') returning * into p;
   end if;
   result:=result||jsonb_build_array(jsonb_build_object('id',p.id,'worker_label','Worker '||lpad(p.worker_number::text,3,'0'),'expires_at',p.expires_at));
  end loop;
  return result;
 elsif p_action in ('replace','disable') then
  select * into p from oracle_private.code_participants where id=p_participant and course_id=p_course for update;
  if not found then raise exception 'Participant unavailable.'; end if;
  if p_action='replace' then
   if not course_record.active then raise exception 'This class is closed.'; end if;
   update oracle_private.code_participants set code_digest=p_items->>'digest',active=true,expires_at=now()+interval '180 days' where id=p.id returning * into p;
  else update oracle_private.code_participants set active=false where id=p.id; end if;
  -- Changing a code invalidates every existing session immediately.
  delete from oracle_private.code_sessions where participant_id=p.id;
  return jsonb_build_object('id',p.id,'worker_label','Worker '||lpad(p.worker_number::text,3,'0'),'expires_at',p.expires_at);
 end if;
 raise exception 'Unknown instructor action.';
end $$;

create or replace function public.code_student(p_session text,p_action text,p_payload jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare p oracle_private.code_participants; t integer; route integer; v_choice integer; v_reform integer:=-1; response text; r jsonb; n integer; request uuid; existing oracle_private.code_dialogue; limits oracle_private.ai_limits;
begin
 select cp.* into p from oracle_private.code_sessions s join oracle_private.code_participants cp on cp.id=s.participant_id join public.oracle_courses c on c.id=cp.course_id
 where s.digest=p_session and s.expires_at>now() and cp.active and cp.expires_at>now() and c.active for update of cp;
 if not found then raise exception 'Your session has ended. Sign in again with your private code.'; end if;
 -- Recheck after waiting for the participant lock: a replacement may have revoked this session.
 if not exists(select 1 from oracle_private.code_sessions where digest=p_session and expires_at>now()) then raise exception 'Your session has ended. Sign in again with your private code.'; end if;
 if p_action='logout' then delete from oracle_private.code_sessions where digest=p_session; return '{}'::jsonb;
 elsif p_action='progress' then
  return jsonb_build_object('participant_id',p.id,'worker_label','Worker '||lpad(p.worker_number::text,3,'0'),'course_id',p.course_id,'course_name',(select name from public.oracle_courses where id=p.course_id),'reflection',p.reflection,'completed_at',p.completed_at,
  'entries',(select coalesce(jsonb_agg(result order by task_id),'[]'::jsonb) from oracle_private.code_submissions where participant_id=p.id));
 elsif p_action='totals' then
  return (select jsonb_build_object('contributions',count(*),'revenue',coalesce(sum((s.result->>'revenue')::integer),0),'paid',coalesce(sum((s.result->>'paid')::integer),0),'completed',(select count(*) from oracle_private.code_participants where course_id=p.course_id and completed_at is not null)) from oracle_private.code_submissions s join oracle_private.code_participants cp on cp.id=s.participant_id where cp.course_id=p.course_id);
 elsif p_action='submit' then
  t:=(p_payload->>'task')::integer; response:=trim(p_payload->>'response');route:=(p_payload->>'route')::integer;
  if t is null or t not between 1 and 9 or response is null or char_length(response) not between 10 and 2000 then raise exception 'Write a valid assignment response.'; end if;
  if t=7 and (route is null or route not between 0 and 2) then raise exception 'Choose a route.'; end if;
  select result into r from oracle_private.code_submissions where participant_id=p.id and task_id=t;
  if found then return r; end if;
  if p.completed_at is not null then raise exception 'This participation record is complete.'; end if;
  select count(*) into n from oracle_private.code_submissions where participant_id=p.id;
  if t<>n+1 then raise exception 'Complete assignments in order. Reload your saved progress.'; end if;
  v_choice:=case when t=7 then route when t=2 then 1 else 0 end;
  if t>7 then select (result->>'choice')::integer into v_reform from oracle_private.code_submissions where participant_id=p.id and task_id=7; end if;
  select o.result into r from oracle_private.visual_outcomes o where o.task_id=t and o.choice=v_choice and o.reform=v_reform;
  if r is null then raise exception 'Assignment configuration is missing.'; end if;
  r:=r||jsonb_build_object('response',response);
  insert into oracle_private.code_submissions values(p.id,t,r,now()); return r;
 elsif p_action='finish' then
  if p.completed_at is not null then return jsonb_build_object('completed_at',p.completed_at); end if;
  response:=trim(p_payload->>'reflection');
  if response is null or char_length(response) not between 40 and 5000 then raise exception 'Write a reflection between 40 and 5000 characters.'; end if;
  select count(*) into n from oracle_private.code_submissions where participant_id=p.id;
  if n<>9 then raise exception 'Complete all nine assignments first.'; end if;
  update oracle_private.code_participants set reflection=response,completed_at=now() where id=p.id returning completed_at into p.completed_at;
  return jsonb_build_object('completed_at',p.completed_at);
 elsif p_action='dialogue' then
  return (select coalesce(jsonb_agg(jsonb_build_object('message',message,'reply',result->>'reply','source',result->>'source','reason',result->>'reason') order by created_at),'[]'::jsonb) from oracle_private.code_dialogue where participant_id=p.id);
 elsif p_action='reserve' then
  response:=trim(p_payload->>'message'); request:=(p_payload->>'request_id')::uuid;
  if request is null or response is null or char_length(response) not between 10 and 1200 then raise exception 'Write 10–1,200 characters.'; end if;
  select * into existing from oracle_private.code_dialogue where request_id=request;
  if found then
   if existing.participant_id<>p.id then raise exception 'Request unavailable.'; end if;
   if existing.result is not null then return jsonb_build_object('cached',existing.result); end if;
   return jsonb_build_object('allowed',false,'reason','This exchange is still processing. Reopen MAX later.');
  end if;
  if p.completed_at is not null then return jsonb_build_object('allowed',false,'reason','This game is complete. You can review your conversation.'); end if;
  select count(*) into n from oracle_private.code_dialogue where participant_id=p.id;
  if n>=3 then return jsonb_build_object('allowed',false,'reason','You have used your three exchanges.'); end if;
  select * into limits from oracle_private.ai_limits where id=1 for update;
  if exists(select 1 from oracle_private.code_dialogue where participant_id=p.id and created_at>clock_timestamp()-interval '15 seconds') then return jsonb_build_object('allowed',false,'reason','Please allow 15 seconds between messages.'); end if;
  if (select count(*) from (select created_at from oracle_private.dialogue union all select created_at from oracle_private.code_dialogue)d where created_at>=date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC')>=limits.daily_limit then return jsonb_build_object('allowed',false,'reason','The daily AI allowance is used up. You can keep playing.'); end if;
  if (select count(*) from (select created_at from oracle_private.dialogue union all select created_at from oracle_private.code_dialogue)d where created_at>clock_timestamp()-interval '1 minute')>=limits.minute_limit then return jsonb_build_object('allowed',false,'reason','MAX is busy. Please try later.'); end if;
  r:=public.code_student(p_session,'dialogue');
  insert into oracle_private.code_dialogue(request_id,participant_id,message) values(request,p.id,response);
  return jsonb_build_object('allowed',true,'history',r,'message',response);
 end if;
 raise exception 'Unknown student action.';
end $$;

create or replace function public.code_finish_dialogue(p_request uuid,p_result jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_result->>'source' is null or p_result->>'source' not in ('ai','authored') or p_result->>'reply' is null or char_length(p_result->>'reply') not between 1 and 4000 then raise exception 'Invalid reply.'; end if;
 update oracle_private.code_dialogue set result=p_result where request_id=p_request and result is null;
end $$;
revoke all on oracle_private.code_participants,oracle_private.code_sessions,oracle_private.code_submissions,oracle_private.code_dialogue,oracle_private.code_login_limits from public,anon,authenticated;
revoke all on function public.code_login_budget(),public.code_login(text,text),public.code_instructor(uuid,text,uuid,jsonb,uuid),public.code_student(text,text,jsonb),public.code_finish_dialogue(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.code_login_budget(),public.code_login(text,text),public.code_instructor(uuid,text,uuid,jsonb,uuid),public.code_student(text,text,jsonb),public.code_finish_dialogue(uuid,jsonb) to service_role;
create or replace function public.reserve_oracle_dialogue(p_course uuid,p_request uuid,p_message text) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.oracle_enrollments; existing oracle_private.dialogue; limits oracle_private.ai_limits; used integer; hist jsonb;
begin
 if p_request is null or p_message is null or char_length(trim(p_message)) not between 10 and 1200 then raise exception 'Write 10–1,200 characters.'; end if;
 select * into e from public.oracle_enrollments where course_id=p_course and user_id=auth.uid() for update;
 if not found then raise exception 'Join this class first.'; end if;
 select * into existing from oracle_private.dialogue where request_id=p_request;
 if found then
  if existing.user_id<>auth.uid() or existing.course_id<>p_course then raise exception 'Request unavailable.'; end if;
  if existing.result is not null then return jsonb_build_object('cached',existing.result); end if;
  return jsonb_build_object('allowed',false,'reason','This exchange is already processing. Continue playing or reopen the conversation later.');
 end if;
 if e.completed_at is not null then return jsonb_build_object('allowed',false,'reason','This game is complete. You can review your saved conversation.'); end if;
 if not exists(select 1 from public.oracle_courses where id=p_course and active) then raise exception 'This class is closed.'; end if;
 select count(*) into used from oracle_private.dialogue where course_id=p_course and user_id=auth.uid();
 if used>=3 then return jsonb_build_object('allowed',false,'reason','You have used your three exchanges. Your participation credit does not depend on AI.'); end if;
 -- A shared locked row makes project-wide budgets safe under concurrent calls.
 select * into limits from oracle_private.ai_limits where id=1 for update;
 if not found then raise exception 'AI limits have not been configured.'; end if;
 if exists(select 1 from oracle_private.dialogue where user_id=auth.uid() and created_at>clock_timestamp()-interval '15 seconds') then return jsonb_build_object('allowed',false,'reason','Please allow 15 seconds between messages. You can continue without AI.'); end if;
 if (select count(*) from (select created_at from oracle_private.dialogue union all select created_at from oracle_private.code_dialogue) all_dialogue where created_at >= date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC')>=limits.daily_limit then return jsonb_build_object('allowed',false,'reason','The daily AI allowance is used up. Authored dialogue is available; your progress is unaffected.'); end if;
 if (select count(*) from (select created_at from oracle_private.dialogue union all select created_at from oracle_private.code_dialogue) all_dialogue where created_at>clock_timestamp()-interval '1 minute')>=limits.minute_limit then return jsonb_build_object('allowed',false,'reason','The AI desk is busy. Use the authored response or return later.'); end if;
 hist:=public.my_oracle_dialogue(p_course);
 insert into oracle_private.dialogue(request_id,course_id,user_id,message) values(p_request,p_course,auth.uid(),trim(p_message));
 return jsonb_build_object('allowed',true,'history',hist,'message',trim(p_message));
end $$;



commit;
