const axios = require('axios');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function askOpenAI(systemPrompt, userPrompt) {
  const resp = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 2000,
    temperature: 0.2
  }, {
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
  });
  return resp.data.choices[0].message.content;
}

module.exports = { askOpenAI };
