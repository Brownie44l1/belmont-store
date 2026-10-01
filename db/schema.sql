create extension if not exists pgcrypto;

create table if not exists public.products (
	id uuid primary key default gen_random_uuid(),
	slug text not null unique,
	name text not null,
	description text not null,
	category text not null check (category in ('software', 'hardware')),
	price_cents integer not null check (price_cents >= 0),
	image_url text not null default '',
	in_stock boolean not null default true,
	created_at timestamptz not null default now()
);

create table if not exists public.orders (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	email text not null,
	total_cents bigint not null check (total_cents >= 0),
	status text not null default 'pending' check (status in ('pending', 'confirmed', 'fulfilled', 'cancelled')),
	created_at timestamptz not null default now()
);

create table if not exists public.order_items (
	id uuid primary key default gen_random_uuid(),
	order_id uuid not null references public.orders(id) on delete cascade,
	product_id uuid references public.products(id) on delete set null,
	name text not null,
	unit_price_cents integer not null check (unit_price_cents >= 0),
	quantity integer not null check (quantity > 0),
	created_at timestamptz not null default now()
);

create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Products are readable by everyone" on public.products;
create policy "Products are readable by everyone"
	on public.products for select using (true);

drop policy if exists "Customers can read their orders" on public.orders;
create policy "Customers can read their orders"
	on public.orders for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Customers can read their order items" on public.order_items;
create policy "Customers can read their order items"
	on public.order_items for select to authenticated
	using (exists (
		select 1 from public.orders
		where orders.id = order_items.order_id and orders.user_id = auth.uid()
	));

create or replace function public.create_order(p_user_id uuid, p_email text, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
	new_order_id uuid;
	expected_count integer;
	matched_count integer;
	order_total bigint;
begin
	if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 50 then
		raise exception 'Invalid order items';
	end if;

	select count(*) into expected_count
	from jsonb_array_elements(p_items) as entries(item)
	where item->>'productId' is not null
		and (item->>'quantity') ~ '^[1-9][0-9]*$'
		and (item->>'quantity')::integer <= 99;

	if expected_count <> jsonb_array_length(p_items) then
		raise exception 'Invalid order quantities';
	end if;

	select count(*) into matched_count
	from jsonb_array_elements(p_items) as entries(item)
	join public.products product on product.slug = item->>'productId'
	where product.in_stock;

	if matched_count <> expected_count then
		raise exception 'One or more products are unavailable';
	end if;

	select sum(product.price_cents::bigint * (item->>'quantity')::integer)
	into order_total
	from jsonb_array_elements(p_items) as entries(item)
	join public.products product on product.slug = item->>'productId';

	insert into public.orders (user_id, email, total_cents)
	values (p_user_id, p_email, order_total)
	returning id into new_order_id;

	insert into public.order_items (order_id, product_id, name, unit_price_cents, quantity)
	select new_order_id, product.id, product.name, product.price_cents, (item->>'quantity')::integer
	from jsonb_array_elements(p_items) as entries(item)
	join public.products product on product.slug = item->>'productId';

	return new_order_id;
end;
$$;

revoke all on function public.create_order(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.create_order(uuid, text, jsonb) to service_role;

insert into public.products (slug, name, description, category, price_cents, image_url, in_stock)
values
	('pos-starter', 'Point of Sale Starter', 'A simple sales and receipt system for growing retail teams.', 'software', 8500000, 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1000&q=85', true),
	('stock-control', 'Stock Control Suite', 'Keep products, stock levels, and purchase records in sync.', 'software', 12000000, 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=85', true),
	('business-website', 'Business Website Package', 'A polished, responsive website designed around your business.', 'software', 25000000, 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1000&q=85', true),
	('it-support', 'IT Support Plan', 'Practical remote support for the technology your team relies on.', 'software', 6000000, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=85', true),
	('nvme-ssd-1tb', '1TB NVMe SSD', 'Fast, dependable storage for workstations and compatible laptops.', 'hardware', 14500000, 'https://images.unsplash.com/photo-1597872200969-2b65d640e7a3?auto=format&fit=crop&w=1000&q=85', true),
	('memory-16gb', '16GB DDR4 Memory', 'A practical memory upgrade for compatible desktop systems.', 'hardware', 7800000, 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=1000&q=85', true),
	('mechanical-keyboard', 'Mechanical Keyboard', 'A sturdy full-size keyboard for focused everyday work.', 'hardware', 5200000, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=85', true),
	('dual-band-router', 'Dual-Band Wi-Fi Router', 'Reliable wireless coverage for a home office or small team.', 'hardware', 6900000, 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1000&q=85', true)
on conflict (slug) do update set
	name = excluded.name,
	description = excluded.description,
	category = excluded.category,
	price_cents = excluded.price_cents,
	image_url = excluded.image_url,
	in_stock = excluded.in_stock;
