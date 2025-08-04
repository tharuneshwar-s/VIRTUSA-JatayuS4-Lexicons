import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseSRKey = process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY || '';

export const supabaseSR = createClient(supabaseUrl, supabaseSRKey);
export const supabase = createClient(supabaseUrl, supabaseKey);