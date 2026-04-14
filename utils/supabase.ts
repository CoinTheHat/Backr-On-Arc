import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

// Create a dummy client or a normal one based on availability. 
// This prevents the "supabaseUrl is required" crash during build.
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        storage: {
            from: () => ({
                upload: () => Promise.resolve({ error: new Error("Supabase not configured"), data: null }),
                getPublicUrl: () => ({ data: { publicUrl: '' } })
            })
        }
    } as any;

