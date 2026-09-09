/**
 * Vercel Serverless Function: /api/config
 * Mengembalikan konfigurasi Supabase (URL dan Anon Key) dari Environment Variables Vercel
 * dengan aman tanpa pernah menaruh token rahasia di dalam repository GitHub.
 */

export default function handler(req, res) {
  // Izinkan CORS jika diperlukan
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Mengambil dari Environment Variables Vercel
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

  return res.status(200).json({
    supabaseUrl,
    supabaseAnonKey,
    configured: Boolean(supabaseUrl && supabaseAnonKey)
  });
}
