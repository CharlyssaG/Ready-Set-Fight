const { createClient } = require('@supabase/supabase-js')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  try {
    const { roundId, playerId, challengerName, challengerDesc } = req.body
    const { data, error } = await db.from('submissions')
      .upsert({ round_id: roundId, player_id: playerId, challenger_name: challengerName, challenger_desc: challengerDesc||'' }, { onConflict: 'round_id,player_id' })
      .select().single()
    if (error) throw error
    return res.status(200).json({ submission: data })
  } catch (e) { return res.status(500).json({ error: e.message }) }
}
