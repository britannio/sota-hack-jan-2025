import { Database } from "@/lib/database.types";
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  // supabase gen types typescript --project-id xmnodidxchypblniqgeu > lib/database.types.ts
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
