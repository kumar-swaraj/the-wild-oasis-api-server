import { createClient } from '@supabase/supabase-js';
import config from '../lib/config/config';

const supabase = createClient(
  config.supabase.url,
  config.supabase.publicApiKey,
);

export default supabase;
