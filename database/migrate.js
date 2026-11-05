const fs = require('node:fs');
const path = require('node:path');

function migrate(db, log = () => {}) {
  const directory = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(directory).filter((file) => /^\d{3}_.+\.sql$/.test(file)).sort();

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const applied = db.prepare('SELECT 1 FROM schema_migrations WHERE version = ?');
  const record = db.prepare('INSERT INTO schema_migrations (version) VALUES (?)');
  const apply = db.transaction((version, sql) => {
    if (applied.get(version)) return false;
    db.exec(sql);
    record.run(version);
    return true;
  });

  for (const file of files) {
    const version = Number(file.slice(0, 3));
    const sql = fs.readFileSync(path.join(directory, file), 'utf8');
    log(`${apply.immediate(version, sql) ? 'APPLIED' : 'SKIP'} ${file}`);
  }
}

module.exports = { migrate };
