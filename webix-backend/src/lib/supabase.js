const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || supabaseUrl.includes('YOUR_SUPABASE_URL')) {
  console.warn('⚠️ Supabase URL missing in webix-backend/.env');
}

const supabase = createClient(
  supabaseUrl ,
  supabaseServiceKey
);

module.exports = { supabase };
