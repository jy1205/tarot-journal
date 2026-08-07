-- ============================================================
-- 塔罗手札 · Supabase 云同步建表脚本
-- 执行方法：Supabase Dashboard → SQL Editor → 粘贴执行
-- 注意：读取公开（AI 可直接读取），写入需要登录（安全）
-- ============================================================

-- 1. 数据表：每类数据一行（key 对应前端 localStorage key）
create table if not exists public.tarot_sync (
  key        text primary key,           -- 如 tarot-note-m1 / tarot-app-data
  value      jsonb not null,             -- 数据内容（任意 JSON）
  updated_at timestamptz not null default now()
);

-- 2. 开启行级安全（RLS）
alter table public.tarot_sync enable row level security;

-- 3. 读取：允许任何人（含匿名）→ AI 用 publishable key 直接爬取
drop policy if exists "tarot_sync_public_read" on public.tarot_sync;
create policy "tarot_sync_public_read"
  on public.tarot_sync
  for select
  using (true);

-- 4. 写入：仅允许登录用户（邮箱+密码注册后）
drop policy if exists "tarot_sync_auth_write" on public.tarot_sync;
create policy "tarot_sync_auth_write"
  on public.tarot_sync
  for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "tarot_sync_auth_update" on public.tarot_sync;
create policy "tarot_sync_auth_update"
  on public.tarot_sync
  for update
  using (auth.role() = 'authenticated');

drop policy if exists "tarot_sync_auth_delete" on public.tarot_sync;
create policy "tarot_sync_auth_delete"
  on public.tarot_sync
  for delete
  using (auth.role() = 'authenticated');

-- 5. （可选）匿名用户也能写 —— 如果不想注册登录，可取消下面注释
--    注意：开启后任何拿到 key 的人都能写，仅限自用场景
-- drop policy if exists "tarot_sync_anon_write" on public.tarot_sync;
-- create policy "tarot_sync_anon_write"
--   on public.tarot_sync
--   for insert
--   with check (true);
--
-- drop policy if exists "tarot_sync_anon_update" on public.tarot_sync;
-- create policy "tarot_sync_anon_update"
--   on public.tarot_sync
--   for update
--   using (true);
--
-- drop policy if exists "tarot_sync_anon_delete" on public.tarot_sync;
-- create policy "tarot_sync_anon_delete"
--   on public.tarot_sync
--   for delete
--   using (true);

-- 验证：查看表结构
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'tarot_sync'
order by ordinal_position;
