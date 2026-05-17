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
  try {
    const token = req.cookies.get('sb-access-token')?.value
    if (!token) return null
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return null
    return user
  } catch (err) {
    console.error('[getSession] Error:', err.message)
    return null
  }
}

export { supabase } // Export existing supabase client