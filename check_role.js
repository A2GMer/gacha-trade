require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
    const { data, error } = await supabase.from("profiles").select("id, role").limit(1);
    if (error) {
        console.error("DB ERROR =>", error.message);
    } else {
        console.log("DB SUCCESS =>", data);
    }
}

main();
