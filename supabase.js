const SUPABASE_URL = "https://asgtdbidfsysglpqzawf.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_GZ76dE5Hig4-ADf883MJvg_2uMh_FKM";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);