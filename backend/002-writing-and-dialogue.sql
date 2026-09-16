-- Apply AFTER schema.sql and outcomes.sql. Preserves existing student records.
begin;
create or replace function public.submit_written_task(p_course uuid,p_task integer,p_response text,p_route integer default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.oracle_enrollments; r jsonb; v_choice integer;
begin
 if p_task is null or p_task not between 1 and 9 or p_response is null or char_length(trim(p_response)) not between 10 and 2000 then raise exception 'Write 10–2,000 characters for a valid assignment.'; end if;
 if p_task=7 and (p_route is null or p_route not between 0 and 2) then raise exception 'Choose a route.'; end if;
 select * into e from public.oracle_enrollments where course_id=p_course and user_id=auth.uid() for update;
 if not found then raise exception 'Join this class first.'; end if;
 select result into r from public.oracle_submissions where course_id=p_course and user_id=auth.uid() and task_id=p_task;
 if found then return r; end if;
 v_choice:=case when p_task=7 then p_route when p_task=2 then 1 else 0 end;
 r:=public.submit_task(p_course,p_task,v_choice);
 r:=r||jsonb_build_object('response',trim(p_response));
 if p_task=2 then r:=r||jsonb_build_object('feedback','Your answer is recorded. Compare it with the map: a supported answer directs the traveler to the ferry and avoids the collapsed bridge. In this version, the six crowns are fixed story pay, not an automated judgment of your writing.'); end if;
 if p_task=4 then r:=r||jsonb_build_object('feedback','Rejected. The Inspector cites an unpublished silver-wing rule. This scripted rejection happens regardless of what you wrote: it demonstrates control over undisclosed standards, not a judgment of your answer.'); end if;
 update public.oracle_submissions set result=r where course_id=p_course and user_id=auth.uid() and task_id=p_task;
 return r;
end $$;
revoke execute on function public.submit_task(uuid,integer,integer) from authenticated;
revoke all on function public.submit_written_task(uuid,integer,text,integer) from public,anon;
grant execute on function public.submit_written_task(uuid,integer,text,integer) to authenticated;

create table if not exists oracle_private.ai_limits (
 id integer primary key check(id=1), daily_limit integer not null check(daily_limit between 1 and 1000), minute_limit integer not null check(minute_limit between 1 and 20)
);
insert into oracle_private.ai_limits values(1,40,15) on conflict do nothing;
create table if not exists oracle_private.dialogue (
 request_id uuid primary key, course_id uuid not null, user_id uuid not null,
 message text not null check(char_length(message) between 10 and 1200), result jsonb,
 created_at timestamptz not null default clock_timestamp(),
 foreign key(course_id,user_id) references public.oracle_enrollments(course_id,user_id) on delete cascade
);
create index if not exists oracle_dialogue_created on oracle_private.dialogue(created_at);
revoke all on oracle_private.ai_limits,oracle_private.dialogue from public,anon,authenticated;

create or replace function public.my_oracle_dialogue(p_course uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.oracle_enrollments where course_id=p_course and user_id=auth.uid()) then raise exception 'Join this class first.'; end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('message',message,'reply',result->>'reply','source',result->>'source','reason',result->>'reason') order by created_at),'[]'::jsonb) from oracle_private.dialogue where course_id=p_course and user_id=auth.uid());
end $$;

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
 if not exists(select 1 from public.oracle_submissions where course_id=p_course and user_id=auth.uid() and task_id=6) then raise exception 'Complete the payment-appeal assignment first.'; end if;
 select count(*) into used from oracle_private.dialogue where course_id=p_course and user_id=auth.uid();
 if used>=3 then return jsonb_build_object('allowed',false,'reason','You have used your three exchanges. Your participation credit does not depend on AI.'); end if;
 -- A shared locked row makes project-wide budgets safe under concurrent calls.
 select * into limits from oracle_private.ai_limits where id=1 for update;
 if not found then raise exception 'AI limits have not been configured.'; end if;
 if exists(select 1 from oracle_private.dialogue where user_id=auth.uid() and created_at>clock_timestamp()-interval '15 seconds') then return jsonb_build_object('allowed',false,'reason','Please allow 15 seconds between messages. You can continue without AI.'); end if;
 if (select count(*) from oracle_private.dialogue where created_at >= date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC')>=limits.daily_limit then return jsonb_build_object('allowed',false,'reason','The daily AI allowance is used up. Authored dialogue is available; your progress is unaffected.'); end if;
 if (select count(*) from oracle_private.dialogue where created_at>clock_timestamp()-interval '1 minute')>=limits.minute_limit then return jsonb_build_object('allowed',false,'reason','The AI desk is busy. Use the authored response or return later.'); end if;
 hist:=public.my_oracle_dialogue(p_course);
 insert into oracle_private.dialogue(request_id,course_id,user_id,message) values(p_request,p_course,auth.uid(),trim(p_message));
 return jsonb_build_object('allowed',true,'history',hist,'message',trim(p_message));
end $$;

create or replace function public.finish_oracle_dialogue(p_request uuid,p_result jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_result is null or p_result->>'source' is null or p_result->>'source' not in ('ai','authored') or p_result->>'reply' is null or char_length(p_result->>'reply') not between 1 and 4000 then raise exception 'Invalid reply.'; end if;
 update oracle_private.dialogue set result=p_result where request_id=p_request and result is null;
end $$;
revoke all on function public.my_oracle_dialogue(uuid),public.reserve_oracle_dialogue(uuid,uuid,text),public.finish_oracle_dialogue(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.my_oracle_dialogue(uuid),public.reserve_oracle_dialogue(uuid,uuid,text) to authenticated;
grant execute on function public.finish_oracle_dialogue(uuid,jsonb) to service_role;

create or replace function public.instructor_records() returns jsonb language plpgsql security definer set search_path='' as $$
declare r jsonb;
begin
 if not exists(select 1 from public.oracle_courses where instructor_id=auth.uid()) then raise exception 'This account does not have instructor access.'; end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.course_name,q.email),'[]'::jsonb) into r from (
 select c.name course_name,u.email,e.reflection,e.completed_at,
 (select count(*) from public.oracle_submissions s where s.course_id=e.course_id and s.user_id=e.user_id) tasks_completed,
 (select coalesce(jsonb_agg(jsonb_build_object('task',s.task_id,'choice',s.choice,'response',s.result->>'response','submitted_at',s.submitted_at) order by s.task_id),'[]'::jsonb) from public.oracle_submissions s where s.course_id=e.course_id and s.user_id=e.user_id) responses,
 (select coalesce(jsonb_agg(jsonb_build_object('message',d.message,'reply',d.result->>'reply','source',d.result->>'source') order by d.created_at),'[]'::jsonb) from oracle_private.dialogue d where d.course_id=e.course_id and d.user_id=e.user_id) dialogue
 from public.oracle_courses c join public.oracle_enrollments e on e.course_id=c.id join auth.users u on u.id=e.user_id where c.instructor_id=auth.uid()
 ) q;
 return r;
end $$;
commit;
