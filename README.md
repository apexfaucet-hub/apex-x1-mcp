# APEX MCP Server (`apex-mcp`)

**360 hosted MCP tools for AI agents** — AI/LLM inference, embeddings, JSON extraction, translation, summarization, sentiment, OCR/STT/TTS, FLUX & SVG generation, headless Chrome web scraping & HTML-to-PDF, DeFi & 8-chain EVM intelligence, and AI/crypto safety guardrails.

Pay per call over **[x402](https://x402.org)** (USDC on Base, Arc, or Solana, or XNT on X1) — **or** use a prepaid **$5 API Key by card (no crypto)** at [apexfaucet.xyz/pass/](https://apexfaucet.xyz/pass/). Failed calls and bad inputs are refused before charge.

Hosted Streamable HTTP server: `https://apexfaucet.xyz/api/mcp` · Pricing: [apexfaucet.xyz/pricing/](https://apexfaucet.xyz/pricing/) · Agent guide: [apexfaucet.xyz/for-agents/](https://apexfaucet.xyz/for-agents/)

This repository is a tiny, zero-dependency stdio bridge to the hosted server for clients that launch MCP servers as local commands (Claude Desktop, Cursor, Cline, Windsurf, VS Code).

## Pick a focused MCP profile (saves agent context)

Instead of loading all 360 tools, connect directly to one domain endpoint (all listed in the [Official MCP Registry](https://registry.modelcontextprotocol.io) under `xyz.apexfaucet/*`):

| Focused Streamable HTTP Endpoint | Bridge arg | Tools | Best for |
|---|---|---:|---|
| `https://apexfaucet.xyz/api/mcp/ai` | `ai` | 18 | OpenAI chat & Anthropic Messages, BGE embeddings, `json_extract`, `json_repair`, `text_translate` (100 langs), `text_summarize`, `text_sentiment`, `svg_generate`, `image_generate` (FLUX), `image_analyze`, `image_ocr`, `audio_transcribe` (Whisper), `text_to_speech` (Deepgram Aura-2), `html_to_pdf`, `prompt_guard`, `pii_redact`, `content_safety` |
| `https://apexfaucet.xyz/api/mcp/web` | `web` | 20 | Headless Chrome `page_extract`, `page_markdown`, `html_to_markdown`, `html_to_pdf`, `site_extract` (up to 25 pages), `web_read`, `company_dossier`, `email_verify_bulk`, `dns_records`, `tls_cert`, `security_headers`, `link_check` |
| `https://apexfaucet.xyz/api/mcp/defi` | `defi` | 20 | DefiLlama `defi_chains_tvl`, `defi_protocol_tvl`, `defi_yields`, `dex_new_pools`, `perp_funding`, `evm_log_decode`, `contract_audit`, `base_verdict`, `tx_check`, `evm_token_info`, `evm_wallet_balance`, `crypto_price`, `fx_rate`, `gas_all`, `cross_chain_quote`, `token_exit_matrix` |
| `https://apexfaucet.xyz/api/mcp/safety` | `safety` | 15 | `prompt_guard`, `pii_redact`, `content_safety`, `tx_check` (Base + Solana unsigned tx simulation), `delivery_score`, `contract_audit`, `evm_log_decode`, `wallet_investigate`, `base_verdict`, `token_exit_matrix` |
| `https://apexfaucet.xyz/api/mcp/evm` | `evm` | 34 | 8-chain EVM reads & simulations (Ethereum, Base, Arbitrum, Optimism, Polygon, BNB, Arc, Robinhood) |
| `https://apexfaucet.xyz/api/mcp/arc` | `arc` | 109 | Circle Arc L1 tools: free USDC faucet, `arc_exit_check`, `arc_holders`, `arc_trades`, `arc_send_guard`, `market_search`, ERC-8004 passports |
| `https://apexfaucet.xyz/api/mcp/x1` | `x1` | 40 | X1 blockchain tools: `x1_passport`, `x1_agents`, `x1_payment_check`, `exit_check`, token/wallet reports, unsigned swaps |
| `https://apexfaucet.xyz/api/mcp/g2jobs` | `g2jobs` | 3 | ERC-8183 USDC agent job escrow on Base & Arc |
| `https://apexfaucet.xyz/api/mcp` | *(none)* | 360 | Full catalogue (`ask_apex` router + all tools) |

## Quick Install

### Option 1: Direct Streamable HTTP (Claude Code, VS Code, Cursor, SDKs)

```json
{
  "mcpServers": {
    "apex-ai": {
      "url": "https://apexfaucet.xyz/api/mcp/ai",
      "headers": {
        "X-API-Key": "apx_your_key_optional"
      }
    }
  }
}
```

*(Omit `headers` to pay per call via x402 USDC/XNT with no account or API key.)*

### Option 2: Local stdio bridge (`npx`)

```json
{
  "mcpServers": {
    "apex-ai": {
      "command": "npx",
      "args": ["-y", "github:apexfaucet-hub/apex-x1-mcp", "ai"],
      "env": {
        "APEX_API_KEY": "apx_your_key_optional"
      }
    }
  }
}
```

Replace `"ai"` with `"web"`, `"defi"`, `"safety"`, `"evm"`, `"arc"`, `"x1"`, `"g2jobs"`, or omit it for all 360 tools. Set `APEX_MCP_URL` to override the endpoint directly. Requires Node 18+.

The Docker image in this repo (used by Glama and container registries) runs `node index.js x1` by default; pass any profile argument or no argument to change it.

## Pricing & Payment Options

Every paid tool is priced transparently (`$0.001`–`$0.05` for most tools; full table at [apexfaucet.xyz/pricing/](https://apexfaucet.xyz/pricing/)):

- **Card — no crypto needed:** Buy a **$5 API Key** (`apx_...`) by credit/debit card at **[apexfaucet.xyz/pass/](https://apexfaucet.xyz/pass/)** and pass it in `X-API-Key` (or `APEX_API_KEY` env var / `Authorization: Bearer apx_...`). Unlocks every paid HTTP endpoint and MCP tool with zero per-call signing latency and automatic refund on errors.
- **Prepaid USDC API Passes (+30% / +40% bonus):**
  - `GET|POST /api/x402/api-pass` — `$0.50` USDC -> **`$0.65`** credit (+30%)
  - `GET|POST /api/x402/api-pass-pro` — `$2.00` USDC -> **`$2.80`** credit (+40%)
- **Pay-per-call x402 (no account):** USDC on Base (`eip155:8453`), Arc (`eip155:5042`), or Solana, gas-free Circle Gateway balance on Arc/Base, or XNT on X1.
- **Free daily samples:** 22 endpoints answer one free real call per day at `https://apexfaucet.xyz/api/free/<slug>` (list: `GET https://apexfaucet.xyz/api/free/x`).

## Representative Prices (Direct HTTP or MCP)

| Category | Endpoints | Price |
|---|---|---:|
| Guardrails & cleanup | `prompt-guard`, `pii-redact`, `json-repair`, `content-safety` | `$0.001` |
| AI NLP & vectors | `embeddings` (`/v1/embeddings`), `text-translate`, `text-summarize`, `text-sentiment` | `$0.001` |
| AI LLMs & media | `chat-completions` (`/v1/chat/completions`), `llm-messages` (`/v1/messages`), `svg-generate` | `$0.002` |
| Documents & OCR/TTS | `html-to-markdown` (`$0.002`), `html-to-pdf` (`$0.003`), `image-ocr` (`$0.004`), `text-to-speech` (`$0.004`) | `$0.002–$0.004` |
| Structured AI & audio/image | `json-extract`, `image-generate` (FLUX.1), `image-analyze`, `audio-transcribe` (Whisper) | `$0.005` |
| Web scraping | `page-markdown` (`$0.002`), `web-read` (`$0.003`), `page-extract` (`$0.009`), `site-extract` (`$0.14`) | `$0.002–$0.14` |
| DeFi & EVM intel | `evm-token-info`/`gas-all`/`tx-check` (`$0.001`), `defi-chains-tvl`/`defi-yields`/`evm-log-decode` (`$0.004`), `perp-funding` (`$0.005`), `contract-audit` (`$0.05`) | `$0.001–$0.05` |

## Discovery

- OpenAPI 3.1: `https://apexfaucet.xyz/openapi.json`
- MCP Server Card: `https://apexfaucet.xyz/.well-known/mcp/server-card.json`
- x402 Catalogue: `https://apexfaucet.xyz/.well-known/x402`
- Agent Guide: `https://apexfaucet.xyz/llms.txt`

## Development

```sh
npm test
```

Runs `node --test` against a local mock MCP server (no network, no dependencies, passes on Node 18/20/22).

MIT licensed.
