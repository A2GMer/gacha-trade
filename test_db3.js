require('dotenv').config({ path: '.env.local', debug: true });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDisputes() {
    const { error } = await supabase.from('disputes').insert({
        trade_id: "00000000-0000-0000-0000-000000000000",
        reporter_id: "00000000-0000-0000-0000-000000000000",
        reason: "test",
        status: "OPEN"
    });
    console.log("Insert error test:", error);
}
checkDisputes();
