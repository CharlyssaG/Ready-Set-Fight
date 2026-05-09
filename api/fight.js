const Anthropic = require('@anthropic-ai/sdk').default

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { anchor, challenger } = req.body
    if (!anchor?.name || !challenger?.name) return res.status(400).json({ error: 'Missing fighter names' })

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const prompt = 'You are the fight simulator for The House Fight Game.\n\n' +
      'Anchor (Fighter A): ' + anchor.name + (anchor.desc ? ' — ' + anchor.desc : '') + '\n' +
      'Challenger (Fighter B): ' + challenger.name + (challenger.desc ? ' — ' + challenger.desc : '') + '\n\n' +
      'Return ONLY valid JSON no markdown:\n' +
      '{"winner":"a" or "b","winnerPct":integer 53-92,' +
      '"stats":[{"name":"max 11ch","a":int 5-95,"b":int 5-95},{"name":"max 11ch","a":int 5-95,"b":int 5-95},{"name":"max 11ch","a":int 5-95,"b":int 5-95}],' +
      '"verdict":"One dry funny line max 75 chars.",' +
      '"quip":"2-3 funny sentences on exactly how this fight went. Reference real character traits. No generic phrases. Max 220 chars."}'

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-5', max_tokens: 600,
      messages: [{ role: 'user', content: prompt }]
    })
    const raw = msg.content.find(c => c.type === 'text')?.text || '{}'
    const result = JSON.parse(raw.replace(/```json|```/g, '').trim())
    return res.status(200).json(result)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: e.message })
  }
}
