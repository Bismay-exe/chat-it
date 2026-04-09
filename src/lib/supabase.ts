import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-key';


export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
