const Anthropic = require('@anthropic-ai/sdk').default

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-5', max_tokens: 200,
      messages: [{ role: 'user', content: 'Generate a random fictional fighter for a party game. ANY character from movies, TV, animation, games, books, mythology. Creative and surprising. ONLY valid JSON no markdown: {"name":"Character name","desc":"2-3 specific fight traits max 80 chars","origin":"Where from"}' }]
    })
    const raw = msg.content.find(c => c.type === 'text')?.text || '{}'
    return res.status(200).json(JSON.parse(raw.replace(/```json|```/g, '').trim()))
  } catch (e) {
    return res.status(200).json({ name: 'Yzma', desc: 'Evil sorceress, transforms people, wildly underestimated', origin: "Emperor's New Groove" })
  }
}
