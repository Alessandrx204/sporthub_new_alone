const { parentPort, workerData } = require('node:worker_threads');
const Database = require('better-sqlite3');
const { createApp } = require('../../backend/app');

const db = new Database(workerData.file);
db.pragma('foreign_keys = ON');
const server = createApp(db, () => Date.parse('2030-11-09T09:00:00Z')).listen(0, '127.0.0.1', () => {
  parentPort.postMessage(server.address().port);
});
parentPort.on('message', () => server.close(() => {
  db.close();
  parentPort.close();
}));
