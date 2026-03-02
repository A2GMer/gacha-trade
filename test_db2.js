require('dotenv').config({ path: '.env.local', debug: true });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTrades() {
    const { data, error } = await supabase.from('trades').select('id, status').eq('status', 'DISPUTE');
    console.log("Disputed trades:", data);
    if (error) console.error("Error:", error);
}

checkTrades();
