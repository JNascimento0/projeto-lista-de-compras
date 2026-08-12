import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rfnvitedvjmxpeumdolo.supabase.co';
const supabaseAnonKey = 'sb_publishable_HXfFSK6lZVyYjEfg00iGXA_enCQK6oE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);