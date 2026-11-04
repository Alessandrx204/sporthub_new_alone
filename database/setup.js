const path = require('node:path');
const Database = require('better-sqlite3');

const databasePath = path.join(__dirname, 'sporthub.db');

const initialFacilities = [
  {
    name: 'Campo Centrale',
    type: 'calcio',
    description: 'Campo all’aperto per partite e allenamenti di calcio.',
    indoor: 0,
    min_booking_duration_minutes: 90
  },
  {
    name: 'Palestra Nord',
    type: 'basket',
    description: 'Palestra coperta con campo da basket e tribuna.',
    indoor: 1,
    min_booking_duration_minutes: 60
  },
  {
    name: 'Campo Tennis',
    type: 'tennis',
    description: 'Campo all’aperto per partite singole e in doppio.',
    indoor: 0,
    min_booking_duration_minutes: 60
  },
  {
    name: 'Piscina Coperta',
    type: 'nuoto',
    description: 'Piscina interna dedicata al nuoto libero e ai corsi.',
    indoor: 1,
    min_booking_duration_minutes: 30
  }
];

function initializeDatabase(db) {
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS facilities (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('calcio', 'basket', 'tennis', 'pallavolo', 'nuoto')),
      description TEXT NOT NULL,
      indoor INTEGER NOT NULL CHECK (indoor IN (0, 1)),
      min_booking_duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (min_booking_duration_minutes > 0)
    );
  `);

  // Aggiorna anche i database della versione iniziale senza cancellare gli impianti.
  const columns = db.prepare('PRAGMA table_info(facilities)').all();
  if (!columns.some((column) => column.name === 'min_booking_duration_minutes')) {
    db.transaction(() => {
      db.exec(`ALTER TABLE facilities ADD COLUMN min_booking_duration_minutes
        INTEGER NOT NULL DEFAULT 60 CHECK (min_booking_duration_minutes > 0)`);
      const update = db.prepare(`UPDATE facilities SET min_booking_duration_minutes = ? WHERE name = ?`);
      for (const facility of initialFacilities) {
        update.run(facility.min_booking_duration_minutes, facility.name);
      }
    })();
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY,
      facility_id INTEGER NOT NULL REFERENCES facilities(id),
      customer_name TEXT NOT NULL CHECK (length(trim(customer_name)) > 0),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL CHECK (end_time > start_time)
    );
  `);

  const count = db.prepare('SELECT COUNT(*) AS total FROM facilities').get().total;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO facilities (name, type, description, indoor, min_booking_duration_minutes)
    VALUES (@name, @type, @description, @indoor, @min_booking_duration_minutes)
  `);
  const seed = db.transaction(() => {
    for (const facility of initialFacilities) insert.run(facility);
  });
  seed();
}

function openDatabase() {
  return new Database(databasePath);
}

module.exports = { databasePath, initializeDatabase, openDatabase };
