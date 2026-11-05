const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Worker } = require('node:worker_threads');
const { once } = require('node:events');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'concurrency-test-secret';
const Database = require('better-sqlite3');
const { initializeDatabase } = require('../database/setup');

test('due server con connessioni distinte non vendono due volte l’ultimo posto', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'sporthub-concurrency-'));
  const workers = [];
  let db;
  try {
    const file = path.join(dir, 'test.db');
    db = new Database(file);
    initializeDatabase(db);
    db.exec("INSERT INTO users VALUES (1, 'test@example.com', 'Test', 'test')");
    const token = jwt.sign({}, process.env.JWT_SECRET, { subject: '1', expiresIn: '1h' });
    db.prepare('INSERT INTO bookings (facility_id, customer_name, start_time, end_time) VALUES (4, ?, ?, ?)')
      .run('Primo', '2030-11-10T10:00:00.000Z', '2030-11-10T11:00:00.000Z');
    const ports = await Promise.all([0, 1].map(async () => {
      const worker = new Worker(path.join(__dirname, 'support/api-worker.js'), { workerData: { file } });
      workers.push(worker);
      const [port] = await once(worker, 'message');
      return port;
    }));
    const responses = await Promise.all(ports.map((port, index) => fetch(`http://127.0.0.1:${port}/bookings`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: 'auth_token=' + token },
      body: JSON.stringify({ facilityId: 4, customerName: `Cliente ${index}`,
        startTime: '2030-11-10T10:00:00Z', endTime: '2030-11-10T11:00:00Z' })
    })));
    assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
    await Promise.all(responses.map((r) => r.json()));
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM bookings').get().n, 2);
  } finally {
    await Promise.all(workers.map(async (worker) => {
      const stopped = once(worker, 'exit');
      worker.postMessage('close');
      await stopped;
    }));
    if (db?.open) db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
