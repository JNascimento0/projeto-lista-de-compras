import { createClient } from '@supabase/supabase-js';

const URL_PADRAO = 'https://rfnvitedvjmxpeumdolo.supabase.co';
const KEY_PADRAO = 'sb_publishable_HXfFSK6lZVyYjEfg00iGXA_enCQK6oE';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || URL_PADRAO;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || KEY_PADRAO;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);