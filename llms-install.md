# Installing the APEX MCP server (for AI assistants such as Cline)

No API key, no account, nothing to configure.

## Option 1: local stdio bridge (works in every client)

Add this to the MCP settings (for Cline: `cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "apex": {
      "command": "npx",
      "args": ["-y", "github:apexfaucet-hub/apex-x1-mcp"]
    }
  }
}
```

Requires Node.js 18 or newer. The bridge forwards every request to the hosted server at `https://apexfaucet.xyz/api/mcp`.

## Option 2: remote server (clients that support Streamable HTTP)

URL: `https://apexfaucet.xyz/mcp`

## Fewer tools in context (optional)

Set `"env": { "APEX_MCP_URL": "https://apexfaucet.xyz/api/mcp/web" }` (3 web tools), `.../api/mcp/arc` (Arc tools) or `.../api/mcp/x1` (X1 tools).

## Check that it works

Ask for the tool list; the full server answers with 153 tools (7 Oct 2026). Paid tools first answer with x402 payment terms (USDC on Arc, Base or Solana); free tools (faucet status and claims by signature, health) answer directly.
