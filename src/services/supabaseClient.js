import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log para te ajudar a identificar na aba Console se a variável foi lida
if (!supabaseUrl) {
  console.warn("⚠️ VITE_SUPABASE_URL não foi encontrada nas variáveis de ambiente!");
}

// Garante que o createClient nunca receba undefined ou texto em branco
const urlValida = supabaseUrl && supabaseUrl.trim() !== '' 
  ? supabaseUrl 
  : 'https://placeholder.supabase.co';

const keyValida = supabaseAnonKey && supabaseAnonKey.trim() !== '' 
  ? supabaseAnonKey 
  : 'placeholder';

export const supabase = createClient(urlValida, keyValida);