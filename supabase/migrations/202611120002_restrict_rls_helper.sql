-- Restrict the dashboard-created RLS event trigger helper to database administrators.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
