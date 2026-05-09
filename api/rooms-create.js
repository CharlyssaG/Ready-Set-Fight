const { createClient } = require('@supabase/supabase-js')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  try {
    const { hostId, anchorName, anchorDesc, isPublic } = req.body
    if (!hostId || !anchorName) return res.status(400).json({ error: 'Missing fields' })

    let code, exists = true
    while (exists) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      code = Array.from({length:6}, () => chars[Math.floor(Math.random()*chars.length)]).join('')
      const { data } = await db.from('rooms').select('id').eq('code', code).maybeSingle()
      exists = !!data
    }

    const { data: room, error } = await db.from('rooms')
      .insert({ code, host_id: hostId, anchor_name: anchorName, anchor_desc: anchorDesc||'', is_public: isPublic !== false, status: 'submitting' })
      .select().single()
    if (error) throw error

    await db.from('room_players').insert({ room_id: room.id, player_id: hostId })

    const { data: round } = await db.from('rounds')
      .insert({ room_id: room.id, round_number: 1, anchor_name: anchorName, anchor_desc: anchorDesc||'', status: 'submitting' })
      .select().single()

    return res.status(200).json({ room, round })
  } catch (e) { return res.status(500).json({ error: e.message }) }
}
