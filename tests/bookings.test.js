const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { createApp } = require('../backend/app');
const { initializeDatabase } = require('../database/setup');

let db, server, apiUrl;
const currentTime = Date.parse('2030-11-09T09:00:00Z');
const valid = { facilityId: 1, customerName: ' Mario ', startTime: '2030-11-10T10:00:00Z', endTime: '2030-11-10T11:30:00Z' };
const count = () => db.prepare('SELECT COUNT(*) AS total FROM bookings').get().total;
async function post(data) {
  const response = await fetch(`${apiUrl}/bookings`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  });
  return { status: response.status, body: await response.json() };
}
before(async () => {
  db = new Database(':memory:');
  initializeDatabase(db);
  server = createApp(db, () => currentTime).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  apiUrl = `http://127.0.0.1:${server.address().port}`;
});
beforeEach(() => db.exec('DELETE FROM bookings'));
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
});

test('salva la durata esatta minima, normalizza nome e fuso, restituisce i dati salvati', async () => {
  const result = await post({ ...valid, startTime: '2030-11-10T11:00:00+01:00' });
  assert.equal(result.status, 201);
  assert.deepEqual(result.body, { id: result.body.id, ...valid, customerName: 'Mario', startTime: '2030-11-10T10:00:00.000Z', endTime: '2030-11-10T11:30:00.000Z' });
  assert.deepEqual(db.prepare('SELECT * FROM bookings').get(), {
    id: result.body.id, facility_id: 1, customer_name: 'Mario',
    start_time: result.body.startTime, end_time: result.body.endTime
  });
});

test('rifiuta campi mancanti, input malformati e date impossibili senza creare righe', async () => {
  const inputs = [null, [], { ...valid, facilityId: '1' }, { ...valid, facilityId: -1 },
    { ...valid, customerName: '  ' }, { ...valid, customerName: 42 },
    { ...valid, startTime: '2030-11-10T10:00:00' },
    { ...valid, startTime: '2030-02-30T10:00:00Z' },
    { ...valid, startTime: '2030-11-10T25:00:00Z' },
    { ...valid, endTime: 'non una data' }];
  for (const field of Object.keys(valid)) {
    const input = { ...valid }; delete input[field]; inputs.push(input);
  }
  for (const input of inputs) assert.equal((await post(input)).status, 400, JSON.stringify(input));
  assert.equal(count(), 0);
});

test('rifiuta intervalli invertiti, nulli, passati e durata inferiore alla minima', async () => {
  for (const changes of [
    { endTime: valid.startTime }, { endTime: '2030-11-10T09:00:00Z' },
    { startTime: '2030-11-09T09:00:00Z' }, { startTime: '2030-11-08T09:00:00Z' }
  ]) assert.equal((await post({ ...valid, ...changes })).status, 400);
  const short = await post({ ...valid, endTime: '2030-11-10T11:29:00Z' });
  assert.equal(short.status, 400);
  assert.match(short.body.error, /90 minuti/);
  assert.equal(count(), 0);
});

test('impianto inesistente restituisce 404 senza inserire', async () => {
  assert.equal((await post({ ...valid, facilityId: 9999 })).status, 404);
  assert.equal(count(), 0);
});

test('rifiuta tutte le forme di sovrapposizione e accetta adiacenze e impianti diversi', async () => {
  assert.equal((await post({ ...valid, facilityId: 3, endTime: '2030-11-10T12:00:00Z' })).status, 201);
  for (const [start, end] of [['09:00', '11:00'], ['11:00', '13:00'], ['10:00', '12:00'], ['09:00', '13:00'], ['10:15', '11:45']]) {
    const result = await post({ ...valid, facilityId: 3, startTime: `2030-11-10T${start}:00Z`, endTime: `2030-11-10T${end}:00Z` });
    assert.equal(result.status, 409, `${start}-${end}`);
  }
  assert.equal(count(), 1);
  for (const [start, end] of [['09:00', '10:00'], ['12:00', '13:00']]) {
    assert.equal((await post({ ...valid, facilityId: 3, startTime: `2030-11-10T${start}:00Z`, endTime: `2030-11-10T${end}:00Z` })).status, 201);
  }
  assert.equal((await post(valid)).status, 201);
  assert.equal(count(), 4);
});

test('due richieste parallele incompatibili creano una sola prenotazione', async () => {
  const results = await Promise.all([post(valid), post({ ...valid, customerName: 'Luigi' })]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  assert.equal(count(), 1);
});

test('un errore DB non lascia righe parziali e non espone dettagli SQL', async () => {
  db.exec(`CREATE TRIGGER fail_booking AFTER INSERT ON bookings BEGIN SELECT RAISE(ABORT, 'errore interno di prova'); END`);
  try {
    const result = await post(valid);
    assert.equal(result.status, 500);
    assert.doesNotMatch(result.body.error, /interno|SQL|trigger/i);
    assert.equal(count(), 0);
  } finally {
    db.exec('DROP TRIGGER fail_booking');
  }
  assert.equal((await post(valid)).status, 201);
});

test('JSON malformato viene rifiutato e il preflight consente il POST dal frontend', async () => {
  const bad = await fetch(`${apiUrl}/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(bad.status, 400);
  assert.equal((await bad.json()).error, 'JSON non valido.');
  const options = await fetch(`${apiUrl}/bookings`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:8080', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } });
  assert.equal(options.status, 204);
  assert.equal(options.headers.get('access-control-allow-origin'), 'http://localhost:8080');
  assert.match(options.headers.get('access-control-allow-methods'), /POST/);
});

test('le prenotazioni sopravvivono al riavvio e le foreign key impediscono riferimenti inesistenti', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'sporthub-test-'));
  let fileDb;
  try {
    const file = path.join(dir, 'test.db');
    fileDb = new Database(file);
    initializeDatabase(fileDb);
    fileDb.prepare('INSERT INTO bookings (facility_id, customer_name, start_time, end_time) VALUES (?, ?, ?, ?)').run(1, 'Mario', valid.startTime, valid.endTime);
    fileDb.close();
    fileDb = new Database(file);
    initializeDatabase(fileDb);
    assert.equal(fileDb.prepare('SELECT COUNT(*) AS total FROM bookings').get().total, 1);
    assert.equal(fileDb.prepare('SELECT COUNT(*) AS total FROM facilities').get().total, 4);
    assert.throws(() => fileDb.prepare('INSERT INTO bookings (facility_id, customer_name, start_time, end_time) VALUES (?, ?, ?, ?)').run(9999, 'Mario', valid.startTime, valid.endTime), /FOREIGN KEY/);
  } finally {
    if (fileDb?.open) fileDb.close();
    rmSync(dir, { recursive: true, force: true });
  }
});


test('piscina e palestra permettono due posti e rifiutano il terzo', async () => {
  for (const facilityId of [2, 4]) {
    assert.equal((await post({ ...valid, facilityId })).status, 201);
    assert.equal((await post({ ...valid, facilityId, customerName: 'Luigi' })).status, 201);
    const full = await post({ ...valid, facilityId, customerName: 'Anna' });
    assert.equal(full.status, 409);
    assert.match(full.body.error, /posti disponibili/);
  }
  assert.equal(count(), 4);
});

test('la capienza dipende dai posti simultanei e non dalla somma degli intervalli adiacenti', async () => {
  for (const [start, end] of [['10:00', '11:00'], ['11:00', '12:00']]) {
    assert.equal((await post({ ...valid, facilityId: 4, startTime: `2030-11-10T${start}:00Z`, endTime: `2030-11-10T${end}:00Z` })).status, 201);
  }
  assert.equal((await post({ ...valid, facilityId: 4, endTime: '2030-11-10T12:00:00Z' })).status, 201);
  assert.equal((await post({ ...valid, facilityId: 4, startTime: '2030-11-10T11:00:00Z', endTime: '2030-11-10T12:00:00Z' })).status, 409);
  assert.equal(count(), 3);
});

test('due richieste parallele per l’ultimo posto non superano la capienza', async () => {
  assert.equal((await post({ ...valid, facilityId: 4 })).status, 201);
  const results = await Promise.all([
    post({ ...valid, facilityId: 4, customerName: 'Anna' }),
    post({ ...valid, facilityId: 4, customerName: 'Luigi' })
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  assert.equal(count(), 2);
});
