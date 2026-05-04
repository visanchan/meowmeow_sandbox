-- void_order — restores event_inventory and marks the order voided.
-- Owner / manager only. Sample lines do not restore stock (they were given away free
-- but did decrement inventory; voiding restores them too).

create or replace function public.void_order(p_order_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id      uuid := auth.uid();
  v_workspace_id uuid;
  v_event_id     uuid;
  v_status       text;
  v_old          jsonb;
begin
  if v_user_id is null then
    raise exception 'void_order: auth required';
  end if;

  select workspace_id, event_id, status, to_jsonb(orders.*)
    into v_workspace_id, v_event_id, v_status, v_old
    from public.orders
    where id = p_order_id
    for update;
  if not found then
    raise exception 'void_order: order % not found', p_order_id;
  end if;
  if v_status = 'voided' then
    raise exception 'void_order: order % is already voided', p_order_id;
  end if;
  if not public.is_workspace_member(v_workspace_id, array['owner','manager']) then
    raise exception 'void_order: forbidden' using errcode = '42501';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'void_order: reason is required';
  end if;

  -- Restore inventory from order_items
  update public.event_inventory ei
    set current_qty = current_qty + oi.qty,
        sold_qty    = greatest(0, sold_qty - oi.qty),
        updated_at  = now()
    from public.order_items oi
    where oi.order_id = p_order_id
      and ei.event_id = v_event_id
      and ei.product_id = oi.product_id;

  update public.orders
    set status            = 'voided',
        payment_status    = 'voided',
        voided_at         = now(),
        voided_by_user_id = v_user_id,
        void_reason       = p_reason
    where id = p_order_id;

  -- Cancel any open send-later fulfillment for this order.
  update public.send_later_orders
    set fulfillment_status = 'cancelled',
        cancelled_at       = now()
    where order_id = p_order_id
      and fulfillment_status not in ('completed','cancelled');

  insert into public.audit_logs(
    workspace_id, user_id, action, target_table, target_id, old_value, new_value
  ) values (
    v_workspace_id, v_user_id, 'void_order', 'orders', p_order_id, v_old,
    jsonb_build_object('reason', p_reason)
  );
end;
$$;

revoke all on function public.void_order(uuid, text) from public;
grant execute on function public.void_order(uuid, text) to authenticated;
