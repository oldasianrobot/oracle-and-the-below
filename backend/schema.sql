-- Run once in a new Supabase project. Settings and classroom records are not publicly writable.
begin;
create schema if not exists oracle_private;
revoke all on schema oracle_private from public, anon, authenticated;
create table public.oracle_courses (
 id uuid primary key default gen_random_uuid(), name text not null,
 join_code text not null unique check(length(join_code)>=12), instructor_id uuid not null references auth.users(id),
 active boolean not null default true
);
create table public.oracle_enrollments (
 course_id uuid references public.oracle_courses(id) on delete cascade,
 user_id uuid references auth.users(id) on delete cascade,
 joined_at timestamptz not null default now(), reflection text,
 completed_at timestamptz, primary key(course_id,user_id)
);
create table public.oracle_submissions (
 course_id uuid not null, user_id uuid not null, task_id integer check(task_id between 1 and 9),
 choice integer not null check(choice between 0 and 2), result jsonb not null,
 submitted_at timestamptz not null default now(), primary key(course_id,user_id,task_id),
 foreign key(course_id,user_id) references public.oracle_enrollments(course_id,user_id) on delete cascade
);
create table oracle_private.outcomes(task_id integer, choice integer, reform integer, result jsonb not null, primary key(task_id,choice,reform));
alter table public.oracle_courses enable row level security;
alter table public.oracle_enrollments enable row level security;
alter table public.oracle_submissions enable row level security;
-- No direct write grants: validated functions own all mutations.
revoke all on public.oracle_courses,public.oracle_enrollments,public.oracle_submissions from anon,authenticated;
revoke all on all tables in schema oracle_private from public,anon,authenticated;

create function public.join_course(p_code text) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.oracle_courses;
begin
 if auth.uid() is null then raise exception 'Sign in first.'; end if;
 select * into c from public.oracle_courses where join_code=trim(p_code) and active;
 if not found then raise exception 'Class code not found or class is closed. Check with your instructor.'; end if;
 insert into public.oracle_enrollments(course_id,user_id) values(c.id,auth.uid()) on conflict do nothing;
 return jsonb_build_object('course_id',c.id,'course_name',c.name);
end $$;

create function public.my_progress(p_course uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.oracle_enrollments; results jsonb;
begin
 select * into e from public.oracle_enrollments where course_id=p_course and user_id=auth.uid();
 if not found then raise exception 'Join this class first.'; end if;
 select coalesce(jsonb_agg(result order by task_id),'[]'::jsonb) into results from public.oracle_submissions where course_id=p_course and user_id=auth.uid();
 return jsonb_build_object('entries',results,'reflection',e.reflection,'completed_at',e.completed_at);
end $$;

create function public.submit_task(p_course uuid,p_task integer,p_choice integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.oracle_enrollments; r jsonb; n integer; v_reform integer := -1;
begin
 if p_task is null or p_choice is null or p_task not between 1 and 9 or p_choice not between 0 and 2 then raise exception 'Invalid assignment or response.'; end if;
 -- Serialize per-student submissions and completion to prevent races and duplicate credit.
 select * into e from public.oracle_enrollments where course_id=p_course and user_id=auth.uid() for update;
 if not found then raise exception 'Join this class first.'; end if;
 select result into r from public.oracle_submissions where course_id=p_course and user_id=auth.uid() and task_id=p_task;
 if found then return r; end if;
 if e.completed_at is not null then raise exception 'This participation record is complete.'; end if;
 if not exists(select 1 from public.oracle_courses where id=p_course and active) then raise exception 'This class is closed.'; end if;
 select count(*) into n from public.oracle_submissions where course_id=p_course and user_id=auth.uid();
 if p_task<>n+1 then raise exception 'Complete assignments in order. Reload your saved progress.'; end if;
 if p_task>7 then select choice into v_reform from public.oracle_submissions where course_id=p_course and user_id=auth.uid() and task_id=7; end if;
 select result into r from oracle_private.outcomes where task_id=p_task and choice=p_choice and outcomes.reform=v_reform;
 if r is null then raise exception 'Assignment configuration is missing.'; end if;
 insert into public.oracle_submissions(course_id,user_id,task_id,choice,result) values(p_course,auth.uid(),p_task,p_choice,r);
 return r;
end $$;

create function public.finish_game(p_course uuid,p_reflection text) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.oracle_enrollments; n integer;
begin
 select * into e from public.oracle_enrollments where course_id=p_course and user_id=auth.uid() for update;
 if not found then raise exception 'Join this class first.'; end if;
 if e.completed_at is not null then return jsonb_build_object('completed_at',e.completed_at); end if;
 if not exists(select 1 from public.oracle_courses where id=p_course and active) then raise exception 'This class is closed.'; end if;
 if p_reflection is null or char_length(trim(p_reflection)) not between 40 and 5000 then raise exception 'Write a reflection between 40 and 5000 characters.'; end if;
 select count(*) into n from public.oracle_submissions where course_id=p_course and user_id=auth.uid();
 if n<>9 then raise exception 'Complete all nine assignments first.'; end if;
 update public.oracle_enrollments set reflection=trim(p_reflection),completed_at=now() where course_id=p_course and user_id=auth.uid() returning * into e;
 return jsonb_build_object('completed_at',e.completed_at);
end $$;

create function public.class_totals(p_course uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r jsonb; finished integer;
begin
 if not exists(select 1 from public.oracle_enrollments where course_id=p_course and user_id=auth.uid()) and not exists(select 1 from public.oracle_courses where id=p_course and instructor_id=auth.uid()) then raise exception 'Join this class first.'; end if;
 select count(*) into finished from public.oracle_enrollments where course_id=p_course and completed_at is not null;
 select jsonb_build_object('contributions',count(*),'revenue',coalesce(sum((result->>'revenue')::integer),0),'paid',coalesce(sum((result->>'paid')::integer),0),'completed',finished) into r from public.oracle_submissions where course_id=p_course;
 return r;
end $$;

create function public.instructor_records() returns jsonb language plpgsql security definer set search_path='' as $$
declare r jsonb;
begin
 if not exists(select 1 from public.oracle_courses where instructor_id=auth.uid()) then raise exception 'This account does not have instructor access.'; end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.course_name,q.email),'[]'::jsonb) into r from (
 select c.name course_name,u.email,e.reflection,e.completed_at,
 (select count(*) from public.oracle_submissions s where s.course_id=e.course_id and s.user_id=e.user_id) tasks_completed,
 (select coalesce(jsonb_agg(jsonb_build_object('task',s.task_id,'choice',s.choice,'submitted_at',s.submitted_at) order by s.task_id),'[]'::jsonb) from public.oracle_submissions s where s.course_id=e.course_id and s.user_id=e.user_id) responses
 from public.oracle_courses c join public.oracle_enrollments e on e.course_id=c.id join auth.users u on u.id=e.user_id where c.instructor_id=auth.uid()
 ) q;
 return r;
end $$;

revoke all on function public.join_course(text),public.my_progress(uuid),public.submit_task(uuid,integer,integer),public.finish_game(uuid,text),public.class_totals(uuid),public.instructor_records() from public,anon;
grant execute on function public.join_course(text),public.my_progress(uuid),public.submit_task(uuid,integer,integer),public.finish_game(uuid,text),public.class_totals(uuid),public.instructor_records() to authenticated;
commit;
