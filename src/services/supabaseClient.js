import { createClient } from '@supabase/supabase-js';

// Convertemos explicitamente para String() para o JS nunca tentar ler como variavel
const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = rawUrl ? String(rawUrl) : 'https://rfnvitedvjmxpeumdolo.supabase.co';
const supabaseAnonKey = rawKey ? String(rawKey) : 'sb_publishable_HXfFSK6lZVyYjEfg00iGXA_enCQK6oE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);