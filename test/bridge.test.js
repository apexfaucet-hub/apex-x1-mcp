'use strict';
// Tests for the stdio bridge: each test spawns index.js against a mock MCP server started here on 127.0.0.1.
// No network access and no dependencies: run with `node --test` (Node >= 18).
const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

const BRIDGE = path.join(__dirname, '..', 'index.js');
const WAIT = 5000;
const seen = [];     // every message the mock received this test, with the mcp-session-id it came with
const children = [];
let server, url;

// The mock answers by method. The test/* methods misbehave on purpose.
function handle(req, res, body) {
  let msg = null; try { msg = JSON.parse(body); } catch (e) { /* recorded as null */ }
  seen.push({ msg, session: req.headers['mcp-session-id'] || null });
  const json = (status, obj, headers) => { res.writeHead(status, { 'content-type': 'application/json', ...headers }); res.end(JSON.stringify(obj)); };
  if (!msg || msg.method === undefined || msg.id === undefined) { res.writeHead(202); return res.end(); }
  const reply = (result, headers) => json(200, { jsonrpc: '2.0', id: msg.id, result }, headers);
  switch (msg.method) {
    case 'initialize':
      return reply({ protocolVersion: '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'mock', version: '0.0.0' } }, { 'mcp-session-id': 'session-1' });
    case 'tools/list':          // answered as a Streamable HTTP event stream
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      return res.end('event: message\ndata: ' + JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { tools: [{ name: 'echo', inputSchema: { type: 'object' } }] } }) + '\n\n');
    case 'test/html502': res.writeHead(502, { 'content-type': 'text/html' }); return res.end('<html>502 Bad Gateway</html>');
    case 'test/json500': return json(500, { error: 'not a JSON-RPC message' });
    case 'test/rpc400': return json(400, { jsonrpc: '2.0', id: msg.id, error: { code: -32602, message: 'invalid params' } });
    case 'test/drop':           // promise 1000 bytes, send a few, then cut the connection
      res.writeHead(200, { 'content-type': 'application/json', 'content-length': '1000' }); res.write('{"jsonrpc":');
      return setTimeout(() => res.socket.destroy(), 20);
    case 'test/slow': return setTimeout(() => reply({ slow: true }), 300);
    default: return reply({});
  }
}

// Spawns the bridge and reads its stdout one JSON-RPC line at a time.
function bridge(endpoint = url) {
  const child = spawn(process.execPath, [BRIDGE], { env: { ...process.env, APEX_MCP_URL: endpoint } });
  children.push(child);
  const lines = [], waiters = [];
  let partial = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    partial += chunk;
    let i;
    while ((i = partial.indexOf('\n')) >= 0) {
      const line = partial.slice(0, i); partial = partial.slice(i + 1);
      let m; try { m = JSON.parse(line); } catch (e) { m = { notJson: line }; }
      if (waiters.length) waiters.shift()(m); else lines.push(m);
    }
  });
  const exited = new Promise((resolve) => child.on('exit', (code, signal) => resolve({ code, signal })));
  return {
    send: (m) => child.stdin.write((typeof m === 'string' ? m : JSON.stringify(m)) + '\n'),
    request: (id, method, params) => child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n'),
    next() {
      if (lines.length) return Promise.resolve(lines.shift());
      return new Promise((resolve, reject) => {
        const w = (m) => { clearTimeout(t); resolve(m); };
        const t = setTimeout(() => { waiters.splice(waiters.indexOf(w), 1); reject(new Error('no answer from the bridge within ' + WAIT + ' ms')); }, WAIT);
        waiters.push(w);
      });
    },
    async quiet(ms = 300) {   // nothing more may arrive
      await new Promise((r) => setTimeout(r, ms));
      assert.deepStrictEqual(lines, [], 'the bridge wrote something nobody asked for');
    },
    end: () => child.stdin.end(),
    exited: () => within(exited, WAIT, 'the bridge did not exit after stdin closed'),
  };
}

function within(promise, ms, message) {
  let t;
  return Promise.race([promise, new Promise((_, reject) => { t = setTimeout(() => reject(new Error(message)), ms); })]).finally(() => clearTimeout(t));
}

function assertError(m, id) {
  assert.strictEqual(m.jsonrpc, '2.0');
  assert.strictEqual(m.id, id);
  assert.strictEqual(m.error && m.error.code, -32000);
  assert.strictEqual(typeof m.error.message, 'string');
}

before(async () => {
  server = http.createServer((req, res) => { let body = ''; req.on('data', (c) => (body += c)).on('end', () => handle(req, res, body)); });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  url = 'http://127.0.0.1:' + server.address().port + '/mcp';
});
beforeEach(() => { seen.length = 0; });
after(() => {
  for (const c of children) if (c.exitCode === null && c.signalCode === null) c.kill();
  server.closeAllConnections(); server.close();
});

test('initialize and tools/list round-trip, and the session id is sent back', async () => {
  const b = bridge();
  b.request(1, 'initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
  const init = await b.next();
  assert.strictEqual(init.id, 1);
  assert.strictEqual(init.result.serverInfo.name, 'mock');
  b.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  b.request(2, 'tools/list');
  const list = await b.next();
  assert.strictEqual(list.id, 2);
  assert.deepStrictEqual(list.result.tools.map((t) => t.name), ['echo']);
  const call = seen.find((s) => s.msg && s.msg.method === 'tools/list');
  assert.strictEqual(call.session, 'session-1');
  b.end(); assert.strictEqual((await b.exited()).code, 0);
});

test('a notification gets no reply', async () => {
  const b = bridge();
  b.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  b.request('after', 'ping');
  assert.strictEqual((await b.next()).id, 'after');
  await b.quiet();
  assert.ok(seen.some((s) => s.msg && s.msg.method === 'notifications/initialized'), 'the notification was not forwarded');
  b.end(); await b.exited();
});

test('a response from the client (id, no method) is forwarded and gets no reply', async () => {
  const b = bridge();
  b.send({ jsonrpc: '2.0', id: 'server-asked', result: {} });
  b.request('after', 'ping');
  assert.strictEqual((await b.next()).id, 'after');
  await b.quiet();
  assert.ok(seen.some((s) => s.msg && s.msg.id === 'server-asked'), 'the response was not forwarded');
  b.end(); await b.exited();
});

test('a non-200 upstream answer becomes a JSON-RPC error with the request id', async () => {
  const b = bridge();
  b.request(10, 'test/html502');
  const html = await b.next();
  assertError(html, 10);
  assert.match(html.error.message, /502/);
  b.request(11, 'test/json500');   // JSON, but not a JSON-RPC answer: must not be passed on as one
  const json = await b.next();
  assertError(json, 11);
  assert.match(json.error.message, /500/);
  b.request(12, 'test/rpc400');    // a JSON-RPC error for this request is passed on unchanged
  assert.deepStrictEqual(await b.next(), { jsonrpc: '2.0', id: 12, error: { code: -32602, message: 'invalid params' } });
  b.request(13, 'ping');           // and the bridge is still running
  assert.deepStrictEqual(await b.next(), { jsonrpc: '2.0', id: 13, result: {} });
  b.end(); assert.strictEqual((await b.exited()).code, 0);
});

test('an unreachable server becomes a JSON-RPC error and the bridge keeps running', async () => {
  const closed = http.createServer();
  await new Promise((r) => closed.listen(0, '127.0.0.1', r));
  const port = closed.address().port;
  await new Promise((r) => closed.close(r));
  const b = bridge('http://127.0.0.1:' + port + '/mcp');
  b.request('a', 'tools/list');
  assertError(await b.next(), 'a');
  b.request('b', 'tools/list');
  assertError(await b.next(), 'b');
  b.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  await b.quiet();
  b.end(); assert.strictEqual((await b.exited()).code, 0);
});

test('a connection dropped mid-answer becomes a JSON-RPC error, not a crash', async () => {
  const b = bridge();
  b.request(20, 'test/drop');
  assertError(await b.next(), 20);
  b.request(21, 'ping');
  assert.deepStrictEqual(await b.next(), { jsonrpc: '2.0', id: 21, result: {} });
  b.end(); assert.strictEqual((await b.exited()).code, 0);
});

test('input that is not a JSON-RPC request does not crash the bridge', async () => {
  const b = bridge();
  b.send('this is not json');
  assert.deepStrictEqual(await b.next(), { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse error' } });
  b.send('null');
  b.send('');
  b.request(30, 'ping');
  assert.deepStrictEqual(await b.next(), { jsonrpc: '2.0', id: 30, result: {} });
  await b.quiet();
  b.end(); assert.strictEqual((await b.exited()).code, 0);
});

test('closing stdin ends the process', async () => {
  const b = bridge();
  b.end();
  assert.deepStrictEqual(await b.exited(), { code: 0, signal: null });
});

test('a request still in flight when stdin closes is answered before the process ends', async () => {
  const b = bridge();
  b.request(40, 'test/slow');
  b.end();
  assert.deepStrictEqual(await b.next(), { jsonrpc: '2.0', id: 40, result: { slow: true } });
  assert.deepStrictEqual(await b.exited(), { code: 0, signal: null });
});
