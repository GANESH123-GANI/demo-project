import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { server } from '../server.js';

test('Server End-to-End Probe', async (t) => {
  const TEST_PORT = 3199;

  await new Promise((resolve) => {
    server.listen(TEST_PORT, resolve);
  });

  t.after(() => {
    server.close();
  });

  await t.test('GET / serves index.html', async () => {
    const res = await fetch(`http://localhost:${TEST_PORT}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('ProcureFlow Enterprise S2P Platform'));
    assert.ok(html.includes('app.js'));
  });

  await t.test('GET /api/system returns system metadata', async () => {
    const res = await fetch(`http://localhost:${TEST_PORT}/api/system`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.name, 'ProcureFlow Enterprise S2P');
    assert.equal(data.entities.length, 3);
  });

  await t.test('GET /api/suppliers returns active suppliers', async () => {
    const res = await fetch(`http://localhost:${TEST_PORT}/api/suppliers`);
    assert.equal(res.status, 200);
    const suppliers = await res.json();
    assert.ok(suppliers.length >= 6);
  });

  await t.test('POST /api/ai/copilot generates contextual citations', async () => {
    const res = await fetch(`http://localhost:${TEST_PORT}/api/ai/copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Explain exception on invoice INV-802', mode: 'invoice' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.response.agent.includes('3-Way Match Assistant'));
    assert.ok(data.response.citations.length > 0);
  });
});

