const { createClient } = require('@supabase/supabase-js')
const Anthropic = require('@anthropic-ai/sdk').default

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const { roundId, roomId } = req.body
    const { data: round } = await db.from('rounds').select('*').eq('id', roundId).single()
    const { data: subs } = await db.from('submissions').select('*, profiles(display_name, avatar_color)').eq('round_id', roundId)
    if (!subs?.length) return res.status(400).json({ error: 'No submissions' })

    await db.from('rounds').update({ status: 'simulating' }).eq('id', roundId)
    await db.from('rooms').update({ status: 'simulating' }).eq('id', roomId)

    const results = []
    for (const sub of subs) {
      const prompt = 'Fight simulator for The House Fight Game.\n' +
        'Anchor (A): ' + round.anchor_name + (round.anchor_desc ? ' — ' + round.anchor_desc : '') + '\n' +
        'Challenger (B): ' + sub.challenger_name + (sub.challenger_desc ? ' — ' + sub.challenger_desc : '') + '\n\n' +
        'ONLY valid JSON: {"winner":"a" or "b","winnerPct":int 53-92,' +
        '"stats":[{"name":"max 11ch","a":int,"b":int},{"name":"max 11ch","a":int,"b":int},{"name":"max 11ch","a":int,"b":int}],' +
        '"verdict":"Dry funny line max 75 chars.",' +
        '"quip":"2-3 funny sentences about this specific fight. Reference real character traits. Max 220 chars."}'

      const msg = await anthropic.messages.create({ model: 'claude-sonnet-4-5', max_tokens: 600, messages: [{ role: 'user', content: prompt }] })
      const raw = msg.content.find(c => c.type === 'text')?.text || '{}'
      const r = JSON.parse(raw.replace(/```json|```/g, '').trim())
      const challPct = r.winner === 'b' ? r.winnerPct : 100 - r.winnerPct
      const isUpset = r.winner === 'b' && challPct < 60

      const { data: fr } = await db.from('fight_results').insert({
        round_id: roundId, submission_id: sub.id, player_id: sub.player_id,
        anchor_name: round.anchor_name, challenger_name: sub.challenger_name,
        winner: r.winner === 'b' ? 'challenger' : 'anchor',
        challenger_win_pct: challPct, stats: r.stats || [], verdict: r.verdict || '', quip: r.quip || '', is_upset: isUpset
      }).select().single()

      const { data: prof } = await db.from('profiles').select('*').eq('id', sub.player_id).single()
      const won = r.winner === 'b'
      const upd = {
        total_rounds: (prof.total_rounds || 0) + 1,
        total_wins: (prof.total_wins || 0) + (won ? 1 : 0),
        total_losses: (prof.total_losses || 0) + (won ? 0 : 1),
      }
      if (won && challPct > (prof.biggest_upset_pct || 0)) {
        upd.biggest_upset_pct = challPct
        upd.biggest_upset_fighter = sub.challenger_name
        upd.biggest_upset_anchor = round.anchor_name
      }
      await db.from('profiles').update(upd).eq('id', sub.player_id)
      results.push(fr)
    }

    await db.from('rounds').update({ status: 'complete' }).eq('id', roundId)
    await db.from('rooms').update({ status: 'results' }).eq('id', roomId)
    return res.status(200).json({ results })
  } catch (e) { console.error(e); return res.status(500).json({ error: e.message }) }
}
