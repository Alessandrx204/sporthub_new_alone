const { test } = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const { initializeDatabase } = require('../database/setup');

test('aggiorna il vecchio database conservando gli impianti e non sovrascrive le durate al secondo avvio', () => {
  const db = new Database(':memory:');
  try {
    db.exec(`
      CREATE TABLE facilities (
        id INTEGER PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL,
        description TEXT NOT NULL, indoor INTEGER NOT NULL
      );
      INSERT INTO facilities VALUES (17, 'Campo Centrale', 'calcio', 'Descrizione esistente', 0);
      INSERT INTO facilities VALUES (18, 'Impianto personalizzato', 'tennis', 'Altro impianto', 1);
    `);

    initializeDatabase(db);
    assert.deepEqual(db.prepare('SELECT * FROM facilities WHERE id = 17').get(), {
      id: 17, name: 'Campo Centrale', type: 'calcio', description: 'Descrizione esistente',
      indoor: 0, min_booking_duration_minutes: 90, capacity: 1, active: 1
    });
    assert.equal(db.prepare('SELECT min_booking_duration_minutes AS duration FROM facilities WHERE id = 18').get().duration, 60);
    db.prepare('UPDATE facilities SET min_booking_duration_minutes = 120 WHERE id = 17').run();
    initializeDatabase(db);
    assert.equal(db.prepare('SELECT min_booking_duration_minutes AS duration FROM facilities WHERE id = 17').get().duration, 120);
    assert.equal(db.prepare('SELECT COUNT(*) AS total FROM facilities').get().total, 2);
  } finally {
    db.close();
  }
});


test('aggiunge capacity conservando prenotazioni e non la sovrascrive al secondo setup', () => {
  const db = new Database(':memory:');
  try {
    db.exec(`
      CREATE TABLE facilities (id INTEGER PRIMARY KEY, name TEXT, type TEXT,
        description TEXT, indoor INTEGER, min_booking_duration_minutes INTEGER);
      INSERT INTO facilities VALUES (4, 'Piscina Coperta', 'nuoto', 'Descrizione precedente', 1, 30);
      CREATE TABLE bookings (id INTEGER PRIMARY KEY, facility_id INTEGER REFERENCES facilities(id),
        customer_name TEXT, start_time TEXT, end_time TEXT);
      INSERT INTO bookings VALUES (27, 4, 'Mario', '2030-11-10T10:00:00.000Z', '2030-11-10T11:00:00.000Z');
    `);
    const booking = db.prepare('SELECT * FROM bookings').get();
    initializeDatabase(db);
    assert.equal(db.prepare('SELECT capacity FROM facilities WHERE id = 4').get().capacity, 2);
    assert.deepEqual(db.prepare('SELECT * FROM bookings').get(), booking);
    db.prepare('UPDATE facilities SET capacity = 3 WHERE id = 4').run();
    initializeDatabase(db);
    assert.equal(db.prepare('SELECT capacity FROM facilities WHERE id = 4').get().capacity, 3);
    assert.deepEqual(db.prepare('SELECT * FROM bookings').get(), booking);
  } finally {
    db.close();
  }
});
