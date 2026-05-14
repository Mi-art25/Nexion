import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false, // ← route handler does this, not the browser
      flowType: 'pkce',
      persistSession: true,
    },
  }
)

export const getSession = async (req) => {
  const { user } = await supabase.auth.api.getUserByCookie(req)
  return user
}

export { supabase } // Export existing supabase client