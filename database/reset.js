const { openDatabase, initializeDatabase } = require('./setup');

const db = openDatabase();

try {
  db.transaction(() => {
    db.exec('DROP TABLE IF EXISTS bookings; DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS facilities; DROP TABLE IF EXISTS schema_migrations');
    initializeDatabase(db);
  }).immediate();
  console.log('Database ripristinato: 4 impianti iniziali, prenotazioni e utenti eliminati.');
} finally {
  db.close();
}
