export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.includes('/api/') && request.method === 'POST') {
      return handleApi(request, env, url);
    }

    return env.ASSETS.fetch(request);
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

async function handleApi(request, env, url) {
  const path = url.pathname.replace(/\/$/, '');

  if (!path.endsWith('/api/summarize')) {
    return json({ error: 'Not found' }, 404);
  }

  // 限流：每 60 秒最多 30 次
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const { success } = await env.AI_RATE_LIMITER.limit({ key: 'summarize:' + ip });

  if (!success) {
    return json({
      error: 'Too many requests. Please wait a minute and try again.',
      code: 'RATE_LIMITED'
    }, 429);
  }

  return handleSummarize(request, env);
}

const LENGTH_PROMPTS = {
  short: 'Summarize the following text in 1-2 sentences. Be direct and specific. Return ONLY the summary.',
  medium: 'Summarize the following text in 3-5 sentences. Cover the main points without unnecessary detail. Return ONLY the summary.',
  long: 'Summarize the following text in 2-3 paragraphs. Preserve the key arguments and any important context. Return ONLY the summary.'
};

async function handleSummarize(request, env) {
  try {
    const body = await request.json();
    const text = (body.text || '').trim();
    const length = body.length || 'medium';

    if (text.length < 100) {
      return json({ error: 'Text must be at least 100 characters.' }, 400);
    }

    const MAX_CHARS = 8000;
    const input = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;

    const systemPrompt = 'You are a professional summarizer. You only return the summary, with no explanations, no preamble, and no quotes around the output.';
    const userPrompt = (LENGTH_PROMPTS[length] || LENGTH_PROMPTS.medium) + '\n\nText:\n' + input;

    const response = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 800,
      temperature: 0.4
    });

    const output = (response.response || '').trim();

    if (!output) {
      return json({ error: 'Model returned empty output. Please try again.' }, 500);
    }

    return json({ output: output });
  } catch (err) {
    console.error('Summarize error:', err);
    return json({ error: 'Processing failed. Please try again in a moment.' }, 500);
  }
}
