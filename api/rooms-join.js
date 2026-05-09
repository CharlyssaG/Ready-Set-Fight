const { createClient } = require('@supabase/supabase-js')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  try {
    const { code, playerId } = req.body
    const { data: room, error } = await db.from('rooms').select('*').eq('code', code.toUpperCase()).single()
    if (error || !room) return res.status(404).json({ error: 'Room not found' })
    await db.from('room_players').upsert({ room_id: room.id, player_id: playerId }, { onConflict: 'room_id,player_id' })
    return res.status(200).json({ room })
  } catch (e) { return res.status(500).json({ error: e.message }) }
}
