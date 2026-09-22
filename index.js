#!/usr/bin/env node
'use strict';
// apex-mcp: a stdio bridge to the hosted APEX MCP server (https://apexfaucet.xyz/api/mcp).
// Clients that launch MCP servers as local commands (Claude Desktop, Cursor, Cline, ...) run this; it forwards every
// JSON-RPC message to the hosted server over Streamable HTTP and writes the answers back. No dependencies, Node >= 18.
// Nothing is stored and no key is involved: paid tools are paid per call with x402 by the caller's own wallet.
const ENDPOINT = process.env.APEX_MCP_URL || 'https://apexfaucet.xyz/api/mcp';
let session = null;
let buf = '';
const out = (obj) => process.stdout.write(JSON.stringify(obj) + '\n');

async function forward(msg) {
  const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'user-agent': 'apex-mcp-bridge/1.0' };
  if (session) headers['mcp-session-id'] = session;
  let res;
  try {
    res = await fetch(ENDPOINT, { method: 'POST', headers, body: JSON.stringify(msg), signal: AbortSignal.timeout(120000) });
  } catch (e) {
    if (msg.id !== undefined) out({ jsonrpc: '2.0', id: msg.id, error: { code: -32000, message: 'APEX MCP server unreachable: ' + e.message } });
    return;
  }
  const sid = res.headers.get('mcp-session-id'); if (sid) session = sid;
  if (msg.id === undefined) return;                       // a notification has no answer
  const text = await res.text();
  if ((res.headers.get('content-type') || '').includes('text/event-stream')) {
    for (const line of text.split('\n')) if (line.startsWith('data:')) { const d = line.slice(5).trim(); if (d) process.stdout.write(d + '\n'); }
    return;
  }
  try { out(JSON.parse(text)); }
  catch (e) { out({ jsonrpc: '2.0', id: msg.id, error: { code: -32000, message: 'HTTP ' + res.status + ' from the APEX MCP server' } }); }
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buf += chunk;
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
    if (!line) continue;
    let msg; try { msg = JSON.parse(line); } catch (e) { out({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse error' } }); continue; }
    forward(msg);
  }
});
