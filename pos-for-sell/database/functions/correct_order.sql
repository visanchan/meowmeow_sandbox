-- correct_order — patch customer info / note on an existing order.
-- For qty corrections, void the order and create a new one (safer + audit-clean).
--
-- payload (jsonb):
-- { "customer_name", "customer_phone", "customer_email", "note" }   (any subset)

create or replace function public.correct_order(p_order_id uuid, payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id      uuid := auth.uid();
  v_workspace_id uuid;
  v_old          jsonb;
begin
  if v_user_id is null then
    raise exception 'correct_order: auth required';
  end if;

  select workspace_id, to_jsonb(o.*) into v_workspace_id, v_old
    from public.orders o where id = p_order_id;
  if v_workspace_id is null then
    raise exception 'correct_order: order % not found', p_order_id;
  end if;
  if not public.is_workspace_member(v_workspace_id, array['owner','manager']) then
    raise exception 'correct_order: forbidden' using errcode = '42501';
  end if;

  update public.orders
    set customer_name  = coalesce(nullif(payload->>'customer_name',  ''), customer_name),
        customer_phone = coalesce(nullif(payload->>'customer_phone', ''), customer_phone),
        customer_email = coalesce(nullif(payload->>'customer_email', ''), customer_email),
        note           = coalesce(nullif(payload->>'note',           ''), note),
        status         = case when status = 'completed' then 'corrected' else status end
    where id = p_order_id;

  insert into public.audit_logs(
    workspace_id, user_id, action, target_table, target_id, old_value, new_value
  ) values (
    v_workspace_id, v_user_id, 'correct_order', 'orders', p_order_id, v_old, payload
  );
end;
$$;

revoke all on function public.correct_order(uuid, jsonb) from public;
grant execute on function public.correct_order(uuid, jsonb) to authenticated;
