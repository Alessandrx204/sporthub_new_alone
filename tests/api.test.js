const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const { createApp } = require('../backend/app');
const { initializeDatabase } = require('../database/setup');

let db;
let server;
let apiUrl;

before(async () => {
  db = new Database(':memory:');
  initializeDatabase(db);
  server = createApp(db).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  apiUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
});

test('GET /facilities/:id restituisce il dettaglio di un impianto', async () => {
  const response = await fetch(`${apiUrl}/facilities/1`);
  const facility = await response.json();

  assert.equal(response.status, 200);
  assert.equal(facility.id, 1);
  assert.equal(facility.name, 'Campo Centrale');
  assert.equal(facility.minBookingDurationMinutes, 90);
  assert.equal(facility.capacity, 1);
});

test('GET /facilities/:id restituisce 404 per un impianto inesistente', async () => {
  const response = await fetch(`${apiUrl}/facilities/9999`);

  assert.equal(response.status, 404);
});


test('GET /facilities restituisce le durate minime dei quattro impianti', async () => {
  const response = await fetch(`${apiUrl}/facilities`);
  const facilities = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(facilities.map((facility) => facility.minBookingDurationMinutes), [90, 60, 60, 30]);
  assert.deepEqual(facilities.map((facility) => facility.capacity), [1, 2, 1, 2]);
});
