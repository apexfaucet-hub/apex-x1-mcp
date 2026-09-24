# APEX MCP server

A real browser for your agent, plus an honest "can I get out?" check for tokens on Arc and other chains.

- **`page_extract`** renders any public URL in headless Chrome, with JavaScript executed, and returns clean text, headings and links. Single-page apps and docs sites that a plain fetch returns empty come back complete.
- **`site_extract`** renders up to 25 pages of one site in a single call. Same host only, robots.txt obeyed.
- **`arc_exit_check`** answers, before you buy a token on Circle's Arc, whether you can sell it again and what the round trip costs: a real buy-then-sell simulated on the live chain, nothing spent, plus the pool's fee (some Arc pools take 49-93% of every trade).
- **`exit_check`** does the same kind of check on Solana, X1 and five EVM chains.
- About 70 more tools for the X1 chain: token lookups, trades, candles, wallet profiles, a free faucet claimed by signature, and a screener.

78 tools in total. The hosted server is `https://apexfaucet.xyz/api/mcp` (Streamable HTTP, no API key). This repository is a
tiny, dependency-free stdio bridge to it, for clients that launch MCP servers as local commands.

## Install

Claude Desktop, Cursor, Cline or any client that runs a command:

```json
{
  "mcpServers": {
    "apex": { "command": "npx", "args": ["-y", "github:apexfaucet-hub/apex-x1-mcp"] }
  }
}
```

Clients that speak Streamable HTTP can skip the bridge and use the URL directly: `https://apexfaucet.xyz/api/mcp`.

Requires Node 18 or newer. Set `APEX_MCP_URL` to point the bridge somewhere else.

## Price

$1 per call for every tool that sells data or work: `page_extract`, `site_extract` (up to 25 pages), token exit checks
and the X1 and Arc data tools. There is no free allowance on those. Payment is [x402](https://x402.org), made by the
caller's own wallet per call: USDC on Arc, Base or Solana, or XNT on X1. The price is stated before you pay, and a call
that fails (a bot wall, an empty render) fails instead of charging. The faucet tools stay free.

## What this bridge does

It reads JSON-RPC messages from stdin, forwards each one to the hosted server, and writes the answers to stdout. It stores
nothing, needs no key, and has no dependencies: read [`index.js`](index.js), it is about 40 lines.

Discovery: [`/.well-known/mcp/server-card.json`](https://apexfaucet.xyz/.well-known/mcp/server-card.json) ·
[`llms.txt`](https://apexfaucet.xyz/llms.txt) · [x402 catalogue](https://apexfaucet.xyz/.well-known/x402)

MIT licensed.
