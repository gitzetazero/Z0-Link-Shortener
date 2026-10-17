# Z0-Link-Shortener

Minimal admin-only link shortener for `short.zzero.me`.

## Features

- Create short links only with an admin token (`x-admin-token` header)
- Redirect short slugs to the original URL
- Uses `https://short.zzero.me` by default (override with `BASE_URL`)
- Stores links in a JSON file (`links.json` by default)

## Run

```bash
npm install
ADMIN_TOKEN="your-secret-token" npm start
```

## Create a short link

```bash
curl -X POST http://localhost:3000/api/links \
  -H 'Content-Type: application/json' \
  -H 'x-admin-token: your-secret-token' \
  -d '{"url":"https://example.com","slug":"example"}'
```

Response:

```json
{
  "slug": "example",
  "url": "https://example.com",
  "shortUrl": "https://short.zzero.me/example"
}
```

Open `http://localhost:3000/example` to redirect.
