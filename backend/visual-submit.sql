-- Included by the migration generator; apply 003-visual-max.sql instead.
create or replace function public.submit_visual_task(p_course uuid,p_task integer,p_response text,p_route integer default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.oracle_enrollments; r jsonb; n integer; v_choice integer; v_reform integer := -1;
begin
 if p_task is null or p_task not between 1 and 9 or p_response is null or char_length(trim(p_response)) not between 10 and 2000 then raise exception 'Write 10–2,000 characters for a valid assignment.'; end if;
 if p_task=7 and (p_route is null or p_route not between 0 and 2) then raise exception 'Choose a route.'; end if;
 select * into e from public.oracle_enrollments where course_id=p_course and user_id=auth.uid() for update;
 if not found then raise exception 'Join this class first.'; end if;
 select result into r from public.oracle_submissions where course_id=p_course and user_id=auth.uid() and task_id=p_task;
 if found then return r; end if;
 if e.completed_at is not null then raise exception 'This participation record is complete.'; end if;
 if not exists(select 1 from public.oracle_courses where id=p_course and active) then raise exception 'This class is closed.'; end if;
 if exists(select 1 from public.oracle_submissions where course_id=p_course and user_id=auth.uid() and coalesce(result->>'edition','')<>'3') then raise exception 'This record belongs to an earlier version. Ask your instructor for a new class code, or explore the updated game in practice.'; end if;
 select count(*) into n from public.oracle_submissions where course_id=p_course and user_id=auth.uid();
 if p_task<>n+1 then raise exception 'Complete assignments in order. Reload your saved progress.'; end if;
 v_choice:=case when p_task=7 then p_route when p_task=2 then 1 else 0 end;
 if p_task>7 then select choice into v_reform from public.oracle_submissions where course_id=p_course and user_id=auth.uid() and task_id=7; end if;
 select result into r from oracle_private.visual_outcomes where task_id=p_task and choice=v_choice and reform=v_reform;
 if r is null then raise exception 'Assignment configuration is missing.'; end if;
 r:=r||jsonb_build_object('response',trim(p_response));
 insert into public.oracle_submissions(course_id,user_id,task_id,choice,result) values(p_course,auth.uid(),p_task,v_choice,r);
 return r;
end $$;
revoke all on function public.submit_visual_task(uuid,integer,text,integer) from public,anon;
grant execute on function public.submit_visual_task(uuid,integer,text,integer) to authenticated;

-- Retire the older submission endpoint to prevent mixing editions.
revoke execute on function public.submit_written_task(uuid,integer,text,integer) from authenticated;
