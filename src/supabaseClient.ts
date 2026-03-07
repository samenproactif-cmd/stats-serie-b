import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://odlpzwrqizqrpouscofu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kbHB6d3JxaXpxcnBvdXNjb2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NzQ4ODcsImV4cCI6MjA4ODQ1MDg4N30.BsWxIITcTxFfD749DWqypvXBCR6ozTP34tAnCQpCnGs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
