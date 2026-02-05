# StackScope Worker

🚀 Deploy your own private Cloudflare Worker logging infrastructure in minutes! CLI tools and templates for StackScope worker deployment with GitHub webhooks, browser log collection, and real-time log streaming.

## What is StackScope Worker?

StackScope Worker is the infrastructure component that:
- **Deploys Cloudflare Workers** that receive logs from browser SDKs
- **Provides CLI tools** for worker initialization, deployment, and monitoring
- **Streams logs in real-time** from your deployed workers
- **Handles GitHub webhooks** for repository event logging
- **Offers complete control** - you own the infrastructure

## Quick Start

### Step 1: Install CLI

```bash
npm install -g stackscope-worker
```

### Step 2: Create Worker

```bash
stackscope-worker init my-app-logs
cd my-app-logs
```

### Step 3: Configure Secrets

```bash
# Required for GitHub webhooks
wrangler secret put GITHUB_WEBHOOK_SECRET

# Optional for API authentication
wrangler secret put API_KEY
```

### Step 4: Deploy

```bash
stackscope-worker deploy
```

### Step 5: Start Using

Your worker is now ready to receive logs! Use the URL in your browser SDK:

```bash
# Install browser SDK in your app
npm install stackscope
```

```javascript
import StackScope from 'stackscope';

const stackscope = new StackScope({
  workerUrl: 'https://my-app-logs.your-username.workers.dev'
});

stackscope.start();
```

## Architecture

StackScope Worker provides you with **your own private, self-contained logging infrastructure**:

```
Browser SDK ────▶ Your Cloudflare Worker ────▶ CLI Log Streaming
   (stackscope)     (Your Deployed Worker)         (Real-time NDJSON)
```

**Critical Architecture Note**: Your deployed worker IS the final destination for logs. StackScope doesn't forward logs to external webhooks or APIs - it's a complete, self-contained logging system where:

- **Worker = Log Endpoint**: Receives and processes all logs
- **Console Output**: Worker outputs structured logs to its console
- **CLI Streaming**: `stackscope-worker logs` command streams from worker console
- **No External APIs Needed**: No webhook endpoints required in your application

## CLI Commands

### `stackscope-worker init <worker-name>`

Initialize a new StackScope worker for your project.

```bash
stackscope-worker init my-project-logs
```

**Options:**
- `--yes, -y`: Skip interactive prompts

**What it does:**
- Creates worker directory with all source code
- Prompts for Cloudflare Account ID and GitHub repository
- Installs dependencies
- Configures wrangler.toml

### `stackscope-worker deploy`

Deploy your worker to Cloudflare.

```bash
cd my-project-logs
stackscope-worker deploy
```

**What it does:**
- Runs pre-deployment checks (wrangler auth, etc.)
- Deploys worker to Cloudflare
- Captures and displays real worker URLs
- Saves configuration for other commands

### `stackscope-worker status [options]`

Check worker health and test endpoints.

```bash
stackscope-worker status                    # Auto-detect from config
stackscope-worker status -w <worker-url>    # Specify worker URL
```

**Options:**
- `--worker-url, -w <url>`: Worker URL to check

**What it does:**
- Tests worker health endpoint
- Validates all logging endpoints
- Shows endpoint URLs for setup

### `stackscope-worker logs [options]`

Stream real-time logs from your worker.

```bash
stackscope-worker logs                      # Stream logs
stackscope-worker logs --follow             # Follow mode
```

**Options:**
- `--follow, -f`: Follow log output
- `--lines, -n <number>`: Number of lines to show

## Worker Endpoints

Your deployed worker provides these endpoints:

- **`/health`** - Health check endpoint
- **`/webhook/browser`** - Receives logs from browser SDK
- **`/webhook/github`** - Receives GitHub webhook events

## Log Streaming & Analysis

### Primary Method: CLI Streaming

StackScope logs are consumed via CLI streaming - not stored in databases:

```bash
# Basic log streaming (main way to view logs)
stackscope-worker logs

# Follow mode for continuous monitoring
stackscope-worker logs --follow

# Show last 10 entries
stackscope-worker logs --lines 10
```

### Log Analysis with Standard Tools

Stream logs for real-time analysis:

```bash
# View all logs
stackscope-worker logs | jq

# Filter by level
stackscope-worker logs | jq 'select(.level == "error")'

# Filter by source
stackscope-worker logs | jq 'select(.source == "browser")'

# Monitor performance metrics
stackscope-worker logs | jq 'select(.meta.type == "performance")'
```

## GitHub Integration

### Webhook Setup

**Note**: This configures GitHub to send webhooks TO your StackScope worker (not the other way around). Your worker receives GitHub events and logs them alongside browser events.

After deploying your worker:

1. Go to your repository settings: `https://github.com/owner/repo/settings/hooks`
2. Click "Add webhook"
3. Configure:
   - **Payload URL**: `https://your-worker.workers.dev/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: Same value as `GITHUB_WEBHOOK_SECRET`
   - **Events**: Choose events to monitor

### Supported Events

- Push events (commits)
- Pull request events
- Issue events  
- Release events
- Workflow run events
- Custom events via repository_dispatch

## Environment Configuration

### Development vs Production

```bash
# Deploy to different environments
wrangler deploy --env staging
wrangler deploy --env production
```

### Worker Secrets

In your worker directory, set secrets:

```bash
# Required
wrangler secret put GITHUB_WEBHOOK_SECRET

# Optional  
wrangler secret put CORS_ORIGINS        # comma-separated allowed origins
wrangler secret put API_KEY             # authentication for log ingestion
wrangler secret put RATE_LIMIT_MAX      # max requests per window
wrangler secret put RATE_LIMIT_WINDOW_MS # rate limit window
```

## Log Format

All logs use NDJSON (Newline Delimited JSON) format:

```json
{
  "level": "info",
  "msg": "User login successful",
  "ts": "2024-01-15T10:30:00.000Z",
  "source": "browser",
  "meta": {
    "type": "console",
    "sessionId": "sess_abc123",
    "url": "https://app.example.com/login",
    "userId": 12345
  }
}
```

### Log Sources

- `browser`: Frontend application logs (from stackscope SDK)
- `worker`: Cloudflare Worker logs
- `github`: Repository webhook events

### Log Types

- `console`: Console output
- `network`: HTTP requests
- `interaction`: User interactions
- `navigation`: Page navigation
- `performance`: Performance metrics
- `visibility`: Page visibility changes

## Troubleshooting

### Worker Deployment Issues

**❌ Worker deployment fails**
```bash
# Check your Cloudflare account ID
wrangler whoami

# Verify wrangler.toml has correct account_id
cat wrangler.toml

# Try deploying directly with wrangler
wrangler deploy

# Check for syntax errors
wrangler dev --local
```

### Log Streaming Issues

**❌ `stackscope-worker logs` shows no output (most common issue)**

**Critical Understanding**: StackScope logs are consumed via CLI streaming from worker console - NOT from external databases or web UIs.

```bash
# 1. Verify worker is deployed and responding
curl https://your-worker.workers.dev/health
# Expected: {"status":"ok","timestamp":"..."}

# 2. Test log endpoint directly
curl -X POST https://your-worker.workers.dev/webhook/browser \
  -H "Content-Type: application/json" \
  -d '[{"level":"info","msg":"test from curl","ts":"2024-01-15T10:30:00.000Z"}]'
# Expected: {"success":true,"processed":1,"source":"browser"}

# 3. Check worker console directly (bypasses CLI)
wrangler tail
# This shows ALL worker activity - you should see log entries here

# Enable debug in browser SDK to see what's being sent:
# const stackscope = new StackScope({ workerUrl: '...', debug: true });
# Check browser console and network tab for errors

# 5. Generate test activity and watch in real-time
# Open two terminals:
# Terminal 1: stackscope-worker logs
# Terminal 2: curl the test command above
# You should see the curl log appear in Terminal 1

# 6. If still no logs, check wrangler is authenticated and worker exists
wrangler whoami
wrangler deployments list
```

**❌ Understanding Common Misconceptions**
```bash
# ❌ WRONG: Looking for logs in external databases
# StackScope doesn't store logs in databases

# ❌ WRONG: Expecting webhook calls to your API
# StackScope worker IS the destination, not a forwarder

# ✅ RIGHT: Streaming from worker console via CLI
stackscope-worker logs  # This is how you view logs

# ✅ RIGHT: Worker console contains the logs
wrangler tail  # Raw worker output (includes all activity)
```

### Health Check Commands

Test each component independently:

```bash
# 1. Test CLI installation
stackscope-worker --help

# 2. Test worker health
curl https://your-worker.workers.dev/health
# Expected: {"status": "ok", "timestamp": "..."}

# 3. Test browser endpoint  
curl -X POST https://your-worker.workers.dev/webhook/browser
# Expected: 400 Bad Request (needs valid log data)

# 4. Test GitHub endpoint
curl -X POST https://your-worker.workers.dev/webhook/github
# Expected: 401 Unauthorized (needs webhook secret)

# 5. Test log streaming
stackscope-worker logs --lines 5
# Should show recent logs or "No logs available"
```

## Browser SDK Integration

This worker infrastructure is designed to work with the `stackscope` browser SDK:

```bash
# In your frontend project
npm install stackscope
```

```javascript
import StackScope from 'stackscope';

const stackscope = new StackScope({
  workerUrl: 'https://your-worker.workers.dev' // Your deployed worker URL
});

stackscope.start();
```

The browser SDK will automatically send logs to your worker's `/webhook/browser` endpoint.

## Development

### Local Development

```bash
# Clone and set up worker infrastructure
git clone https://github.com/JRGCr/stackscope-worker
cd stackscope-worker

# Install dependencies
npm install

# Run development worker
npm run worker:dev
```

### Worker Template Structure

The worker template includes:

- **Dependency Injection**: Clean architecture with interfaces
- **Request Routing**: Handlers for different endpoints
- **GitHub Webhooks**: Signature validation and event mapping
- **CORS Support**: Configurable cross-origin access
- **Rate Limiting**: Built-in request rate limiting
- **TypeScript**: Full type safety throughout

## Support

- **Browser SDK**: Install `stackscope` package for frontend integration
- **Issues**: [GitHub Issues](https://github.com/JRGCr/stackscope-worker/issues)
- **CLI Help**: `stackscope-worker --help` for command reference

## License

MIT License - see [LICENSE](LICENSE) for details.