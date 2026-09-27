# AI Text Summarizer

A Cloudflare Worker that summarizes text using Workers AI (Llama 3.2 3B).

## Features

- Three summary lengths: short, medium, long
- Runs on Cloudflare Workers AI — no API keys
- Built-in rate limiting (30 requests/min per IP)
- Text is not stored or logged
- 8,000 character limit per request
- Multi-language interface (EN + ZH)

## Architecture

- **Worker** handles `POST /api/summarize`
- **Workers AI** bound via `[ai]`
- **Rate Limiting** bound via `[[ratelimits]]`
- **Static assets** in `public/`

## Setup

```bash
npm install
npx wrangler login
npx wrangler deploy
```

## Free tier

- Workers AI: 10,000 Neurons/day (~200 summaries)
- Rate Limiting: included

## License

MIT
