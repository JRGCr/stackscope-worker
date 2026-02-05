# StackScope Worker - Secure Configuration

GitHub webhook endpoint is now active and ready to process repository events. Testing log file output...

## Security Features

This worker implements multiple security layers to prevent unauthorized access and abuse:

### 1. CORS Origin Validation
- **Development**: Allows localhost origins only
- **Staging/Production**: Restricts to configured domains via `CORS_ORIGINS` environment variable
- **No wildcards** in production (disabled by default)

### 2. API Key Authentication
- Optional but recommended for production
- Supports header (`X-API-Key`) or query parameter (`apiKey`)
- Uses constant-time comparison to prevent timing attacks

### 3. Rate Limiting
- Configurable per-environment limits
- Default: 100 requests per minute in production
- Per-IP tracking using Cloudflare headers

## Configuration

### Environment Variables

```toml
# wrangler.toml
[env.production]
vars = { ENVIRONMENT = "production" }
```

### Secrets (set via dashboard or CLI)

```bash
# Set allowed origins (comma-separated)
wrangler secret put CORS_ORIGINS
# Example: https://app.example.com,https://www.example.com

# Set API key for authentication
wrangler secret put API_KEY
# Example: sk_live_abc123xyz789

# Optional: Customize rate limits
wrangler secret put RATE_LIMIT_MAX
# Example: 50

wrangler secret put RATE_LIMIT_WINDOW_MS
# Example: 60000 (1 minute)
```

## Deployment

### Development
```bash
npm install
wrangler dev
```

### Staging
```bash
wrangler deploy --env staging
```

### Production
```bash
wrangler deploy --env production
```

## Usage

### With Authentication
```javascript
fetch('https://stackscope-worker.example.workers.dev/api/log', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key'
  },
  body: JSON.stringify([
    { level: 'info', msg: 'Test log' }
  ])
});
```

### SDK Integration
```html
<!-- Include API key in SDK initialization -->
<script src="https://stackscope-worker.example.workers.dev/sdk.js"></script>
<script>
  stackscope.init({
    endpoint: 'https://stackscope-worker.example.workers.dev/api/log',
    apiKey: 'your-api-key'
  });
</script>
```

## Security Best Practices

1. **Always use API keys in production**
   - Generate strong, random keys
   - Rotate keys periodically
   - Never commit keys to version control

2. **Configure CORS properly**
   - List only your actual domains
   - Avoid using wildcard (*) origins
   - Include both www and non-www variants if needed

3. **Monitor rate limits**
   - Adjust based on actual usage patterns
   - Consider different limits for different environments
   - Use Cloudflare Analytics to track usage

4. **Use HTTPS only**
   - Workers automatically use HTTPS
   - Ensure your application also uses HTTPS

## Testing Security

### Test CORS rejection
```bash
curl -H "Origin: https://evil.com" \
  https://your-worker.workers.dev/api/health
# Should not include Access-Control-Allow-Origin header
```

### Test authentication
```bash
# Without key (should fail if auth enabled)
curl -X POST https://your-worker.workers.dev/api/log \
  -H "Content-Type: application/json" \
  -d '[{"level":"info","msg":"test"}]'

# With key (should succeed)
curl -X POST https://your-worker.workers.dev/api/log \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '[{"level":"info","msg":"test"}]'
```

### Test rate limiting
```bash
# Send many requests quickly
for i in {1..150}; do
  curl -X GET https://your-worker.workers.dev/api/health &
done
# Should see 429 errors after limit reached
```