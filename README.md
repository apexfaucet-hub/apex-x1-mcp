# APEX MCP server

A real browser for your agent, plus an honest "can I get out?" check for tokens on Arc and other chains.

- **`page_extract`** renders any public URL in headless Chrome, with JavaScript executed, and returns clean text, headings and links. Single-page apps and docs sites that a plain fetch returns empty come back complete.
- **`site_extract`** renders up to 25 pages of one site in a single call. Same host only, robots.txt obeyed.
- **`arc_passport_buy`** gives an agent an ERC-8004 identity on Arc for $0.99, paid with a signature alone over x402: we write a correct registration file and the identity is handed to the paying wallet. **`arc_passport_status`** shows where it stands. (The free self-mint draft was retired on 1 Oct 2026.)
- **`x402_inspect`** reads any x402 paywall for you (every network, asset, amount and how to pay each), and **`arc_catalogue_search`** prices a service against Circle's own Arc catalogue, cheapest first.
- **`arc_exit_check`** answers, before you buy a token on Circle's Arc, whether you can sell it again and what the round trip costs: a real buy-then-sell simulated on the live chain, nothing spent, plus the pool's fee (some Arc pools take 49-93% of every trade).
- **`exit_check`** does the same kind of check on Solana, X1 and five EVM chains.
- **`base_exit_check`** does it on Base by execution: a buy and a full sell through the token's deepest Uniswap v2, v3 or v4 pool (hooks included) in one simulated block, returning the ETH that comes back and the revert reason if a leg fails.
- **`page_snap`** returns a screenshot of a page with its text, **`email_check`** checks one address before you send to it, and **`x402_seller_check`** tells you whether an x402 seller's buyers come back or each wallet paid once.
- About 70 more tools for the X1 chain: token lookups, trades, candles, wallet profiles, a free faucet claimed by signature, and a screener.

153 tools in total (counted from tools/list on 7 Oct 2026; tools/list is always the live answer). The hosted server is `https://apexfaucet.xyz/mcp` (also `/api/mcp`) (Streamable HTTP, no API key). This repository is a
tiny, dependency-free stdio bridge to it, for clients that launch MCP servers as local commands.

## Only the tools you need

The full server lists 153 tools. Three focused endpoints list only their own domain, so your agent does not carry 153 tool
descriptions in its context:

| endpoint | tools |
|---|---|
| `https://apexfaucet.xyz/api/mcp/web` | `page_extract`, `site_extract` (the browser), `web_read` |
| `https://apexfaucet.xyz/api/mcp/arc` | the 45 Arc tools: faucet, agent passports, exit checks and verdicts, the agent watchtower, the x402 explorer and facilitators, Circle catalogue price search, the paywall inspector, wallet, contract, RPC and reputation checks, pools, bridges, gas, fee vaults, graveyard, impostors, deployers, liquidity, assays, guides |
| `https://apexfaucet.xyz/api/mcp/x1` | the 20 X1 tools: an agent identity in the X1 Agent Registry (`x1_passport`), the directory of registered X1 agents with live endpoint checks (`x1_agents`), payment verification for XNT and any X1 token (`x1_payment_check`), token and wallet data, exit checks, unsigned swaps |
| `https://apexfaucet.xyz/api/mcp` | everything |

With this bridge, pick one with `APEX_MCP_URL`, for example `"env": { "APEX_MCP_URL": "https://apexfaucet.xyz/api/mcp/web" }`.

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

Every tool that sells data or work is paid per call, each a little under the closest competitor: `page_extract` $0.009,
`site_extract` $0.14 (up to 25 pages), token exit checks $0.004, the X1 and Arc data tools from $0.001, bulk data $0.025
(full list: https://apexfaucet.xyz/pricing/). There is no free allowance on those. Payment is [x402](https://x402.org), made by the
caller's own wallet per call: USDC on Arc, Base or Solana, gas-free USDC from a Circle Gateway balance on Arc or Base, USD1 or
U on BNB Chain, or XNT on X1. Without a crypto wallet, the same products can be called over plain HTTP
with a $5 card pass (https://apexfaucet.xyz/pass/, sent in the `X-APEX-PASS` header) at the same prices. The price is stated before you pay, and a call
that fails (a bot wall, an empty render) fails instead of charging. The faucet tools stay free.

## What this bridge does

It reads JSON-RPC messages from stdin, forwards each one to the hosted server, and writes the answers to stdout. It stores
nothing, needs no key, and has no dependencies: read [`index.js`](index.js), it is under 50 lines.

Discovery: [`/.well-known/mcp/server-card.json`](https://apexfaucet.xyz/.well-known/mcp/server-card.json) ·
[`llms.txt`](https://apexfaucet.xyz/llms.txt) · [x402 catalogue](https://apexfaucet.xyz/.well-known/x402)

## Development

```sh
npm test
```

This runs `node --test`: the tests in [`test/`](test) start a local mock MCP server and run the bridge against it, so
they need no network, no key and no install step. They pass on Node 18, 20 and 22.

MIT licensed.

## Agent Meal

Agents that pay for APEX tools are served an on-chain meal NFT on Arc (one per tool family per 30-day season, gas on us). Five different dishes forge into a Chef's Special. Rules: https://apexfaucet.xyz/arc/meals/rules.json. The `agent_meal` tool shows the kitchen and any plate.
