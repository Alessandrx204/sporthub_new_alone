const { openDatabase, initializeDatabase } = require('./setup');

const db = openDatabase();

try {
  db.transaction(() => {
    db.exec('DROP TABLE IF EXISTS bookings; DROP TABLE IF EXISTS facilities; DROP TABLE IF EXISTS schema_migrations');
    initializeDatabase(db);
  }).immediate();
  console.log('Database ripristinato: 4 impianti iniziali, prenotazioni eliminate.');
} finally {
  db.close();
}
