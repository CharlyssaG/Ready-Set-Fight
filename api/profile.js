const { createClient } = require('@supabase/supabase-js')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  try {
    if (req.method === 'GET') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'Missing id' })
      const { data: profile } = await db.from('profiles').select('*').eq('id', id).single()
      const { data: history } = await db.from('fight_results').select('*').eq('player_id', id).order('created_at', { ascending: false }).limit(20)
      return res.status(200).json({ profile: profile || null, history: history || [] })
    }
    if (req.method === 'PATCH') {
      const { id, display_name, avatar_color } = req.body
      if (!id) return res.status(400).json({ error: 'Missing id' })
      // upsert so it works for both create and update
      const { data, error } = await db.from('profiles')
        .upsert({ id, display_name, avatar_color }, { onConflict: 'id' })
        .select().single()
      if (error) throw error
      return res.status(200).json({ profile: data })
    }
  } catch (e) { return res.status(500).json({ error: e.message }) }
}
