const { openDatabase, initializeDatabase } = require('./setup');

const db = openDatabase();

try {
  db.exec('DROP TABLE IF EXISTS bookings; DROP TABLE IF EXISTS facilities');
  initializeDatabase(db);
  console.log('Database ripristinato: 4 impianti iniziali, prenotazioni eliminate.');
} finally {
  db.close();
}
