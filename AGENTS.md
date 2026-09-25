# AGENTS.md

Instructions for AI coding agents working in this repository, or adding this MCP server to another project.

## What this is

A dependency-free stdio bridge (`index.js`, about 40 lines) to the hosted APEX MCP server at
`https://apexfaucet.xyz/api/mcp`. It reads JSON-RPC lines from stdin, POSTs each one to the hosted server over
Streamable HTTP, keeps the `mcp-session-id` header, and writes the answers to stdout. The tools themselves live on
the server, not here.

## Adding it to a project or client

Command-launched clients (Claude Desktop, Cursor, Cline, and others):

```json
{ "mcpServers": { "apex": { "command": "npx", "args": ["-y", "github:apexfaucet-hub/apex-x1-mcp"] } } }
```

Clients that speak Streamable HTTP can use `https://apexfaucet.xyz/api/mcp` directly, without this bridge.
No API key is needed. Paid tools cost from $0.003 per call ($0.009 for a rendered page, $0.14 for up to 25 pages), paid with x402 by the caller's own wallet; the price is stated
before anything is paid. See the README for the tools and prices.

## Run and test

Requires Node 18 or newer. There is no install step and no build.

Smoke test (it should print `init true` and then the tool count):

```sh
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  | node index.js \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{for(const l of d.trim().split('\n')){const j=JSON.parse(l);console.log(j.result&&j.result.tools?'tools '+j.result.tools.length:'init '+!!j.result)}})"
```

To point the bridge at another server, set `APEX_MCP_URL`.

## Rules for changes

- **No dependencies.** Use only Node built-ins (`fetch` is global from Node 18). Anyone should be able to read the
  whole bridge in a minute before running it.
- **stdout is the protocol.** Write only JSON-RPC messages to stdout, one per line. Logs go to stderr.
- **Never store, log or forward secrets**, wallet keys or seed phrases. The bridge holds no state except the MCP
  session id.
- **A notification (no `id`) gets no reply.** A failed request gets a JSON-RPC error carrying the same `id`. It is
  never silently dropped and never answered with invented data.
- **Keep the README true.** If a tool, a price or a count changes, check it against the live server
  (`tools/list`) before writing it.

## Commits and pull requests

Keep commits small, and describe what changed and why in plain words. Run the smoke test before opening a pull
request and paste its output into the description.
