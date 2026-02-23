import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY env degiskenleri tanimlanmali.'
  )
}

let _capturedAuthType: string | null = null

const hash = window.location.hash
if (hash) {
  const hashParams = new URLSearchParams(hash.substring(1))
  _capturedAuthType = hashParams.get('type')
}

export function getCapturedAuthType(): string | null {
  return _capturedAuthType
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
