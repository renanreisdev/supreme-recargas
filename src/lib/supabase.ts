import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dmtdzdwrwjyjircccyfw.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtdGR6ZHdyd2p5amlyY2NjeWZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3OTQxMzAsImV4cCI6MjEwMjM3MDEzMH0.VAuvsPmO_mej0a0UodaC9elLVDZbvC5UuDOyPTos9aw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
