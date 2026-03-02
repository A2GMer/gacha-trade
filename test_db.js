require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDisputes() {
    const { data, error } = await supabase.from('disputes').select('*');
    console.log("All disputes:", data);
    if (error) console.error("Error:", error);
}

checkDisputes();
