
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Key environment variables.");
}

const isServiceRoleKey = supabaseKey === process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log(`[Supabase] Initializing client with ${isServiceRoleKey ? "Service Role" : "Public/Anon"} Key`);

export const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadImageToSupabase = async (
  imageBuffer: Buffer,
  fileName: string,
  contentType: string
) => {
  const { data, error } = await supabase.storage
    .from('media') // Ensure this bucket exists in your Supabase project
    .upload(fileName, imageBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error('Supabase Upload Error:', error);
    if (error.message.includes("Bucket not found")) {
        console.error("PLEASE CREATE A PUBLIC STORAGE BUCKET NAMED 'media' IN YOUR SUPABASE DASHBOARD.");
    }
    throw error;
  }

  const { data: publicData } = supabase.storage
    .from('media')
    .getPublicUrl(fileName);

  return publicData.publicUrl;
};
