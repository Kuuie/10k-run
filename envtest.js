console.log({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonSet: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceSet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  site: process.env.SITE_URL
});

