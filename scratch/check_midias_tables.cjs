const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('midias_cronograma').select('*').limit(1);
    console.log('midias_cronograma error:', error?.message);
    
    // Check if there's a table for virtual hd
    const { data: d2, error: e2 } = await supabase.from('midias_assets').select('*').limit(1);
    console.log('midias_assets error:', e2?.message);
    
    // Check se tem fotos de midias
    const { data: d3, error: e3 } = await supabase.from('midias_hd').select('*').limit(1);
    console.log('midias_hd error:', e3?.message);
}
check();
