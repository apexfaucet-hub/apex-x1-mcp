#!/usr/bin/env node
'use strict';
// apex-mcp: a stdio bridge to the hosted APEX MCP server (https://apexfaucet.xyz/api/mcp).
// Clients that launch MCP servers as local commands (Claude Desktop, Cursor, Cline, ...) run this; it forwards every
// JSON-RPC message to the hosted server over Streamable HTTP and writes the answers back. No dependencies, Node >= 18.
// Nothing is stored: paid tools are paid per call with x402 by the caller's own wallet, or with an optional prepaid
// API key (`APEX_API_KEY=apx_...` from https://apexfaucet.xyz/pass/ or /api/x402/api-pass, forwarded as X-API-Key).
// One argument picks a focused profile of the same server: `ai`, `web`, `defi`, `safety`, `evm`, `arc`, `x1`, or `g2jobs`.
// No argument = every tool (https://apexfaucet.xyz/api/mcp). APEX_MCP_URL overrides both.
const PROFILES = ['x1', 'arc', 'web', 'ai', 'defi', 'safety', 'evm', 'g2jobs'];
const PROFILE = PROFILES.includes(String(process.argv[2] || '').toLowerCase()) ? String(process.argv[2]).toLowerCase() : null;
const ENDPOINT = process.env.APEX_MCP_URL || 'https://apexfaucet.xyz/api/mcp' + (PROFILE ? '/' + PROFILE : '');
const RAW_KEY = String(process.env.APEX_API_KEY || process.env.APEX_PASS || '').trim();
const API_KEY = /^apx_[A-Za-z0-9_-]{8,120}$/.test(RAW_KEY) ? RAW_KEY : null;
let session = null;
let buf = '';
const out = (obj) => process.stdout.write(JSON.stringify(obj) + '\n');

async function forward(msg) {
  const id = msg && msg.method !== undefined ? msg.id : undefined; // only a request (method + id) gets an answer
  const fail = (message) => out({ jsonrpc: '2.0', id, error: { code: -32000, message } });
  const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'user-agent': 'apex-mcp-bridge/1.3' };
  if (session) headers['mcp-session-id'] = session;
  if (API_KEY) headers['x-api-key'] = API_KEY;
  let res, text;
  try {
    res = await fetch(ENDPOINT, { method: 'POST', headers, body: JSON.stringify(msg), signal: AbortSignal.timeout(120000) });
    const sid = res.headers.get('mcp-session-id'); if (sid) session = sid;
    if (id === undefined) return;                         // a notification (or the client's own response) has no answer
    text = await res.text();                              // a connection dropped mid-body rejects here
  } catch (e) {
    if (id !== undefined) fail('APEX MCP server unreachable: ' + e.message);
    return;
  }
  if ((res.headers.get('content-type') || '').includes('text/event-stream')) {
    for (const line of text.split('\n')) if (line.startsWith('data:')) { const d = line.slice(5).trim(); if (d) process.stdout.write(d + '\n'); }
    return;
  }
  let reply; try { reply = JSON.parse(text); } catch (e) { /* not JSON: answered below */ }
  if (reply && (res.ok || reply.id === id)) out(reply);  // a non-2xx body is passed on only if it answers this request
  else fail('HTTP ' + res.status + ' from the APEX MCP server');
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
