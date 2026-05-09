const { createClient } = require('@supabase/supabase-js')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  try {
    const { data, error } = await db.from('leaderboard').select('*').limit(50)
    if (error) throw error
    return res.status(200).json({ leaderboard: data })
  } catch (e) { return res.status(500).json({ error: e.message }) }
}
