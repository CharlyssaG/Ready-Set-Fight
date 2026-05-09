const { createClient } = require('@supabase/supabase-js')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  try {
    const { roomId, anchorName, anchorDesc, hostId } = req.body
    const { data: room } = await db.from('rooms').select('*').eq('id', roomId).single()
    if (room.host_id !== hostId) return res.status(403).json({ error: 'Not host' })
    const newNum = (room.current_round || 1) + 1
    await db.from('rooms').update({ anchor_name: anchorName, anchor_desc: anchorDesc||'', current_round: newNum, status: 'submitting' }).eq('id', roomId)
    const { data: round } = await db.from('rounds')
      .insert({ room_id: roomId, round_number: newNum, anchor_name: anchorName, anchor_desc: anchorDesc||'', status: 'submitting' })
      .select().single()
    return res.status(200).json({ round })
  } catch (e) { return res.status(500).json({ error: e.message }) }
}
