-- Kids change only their own picture. The target comes from auth.uid(), never the
-- caller. The master is a grown-up, so it can never match, and its guards still run.
create function public.set_own_avatar(p_avatar text) returns text
language plpgsql security definer set search_path='' as $$
declare saved text;
begin
  if auth.uid() is null or not private.session_valid() then
    raise exception 'Sign in again' using errcode='28000';
  end if;
  update public.profiles set avatar=p_avatar
    where id=auth.uid() and role='child' and not is_master
    returning avatar into saved;
  if not found then raise exception 'Child login required' using errcode='42501'; end if;
  return saved;
end;
$$;
revoke all on function public.set_own_avatar(text) from public,anon;
grant execute on function public.set_own_avatar(text) to authenticated;
