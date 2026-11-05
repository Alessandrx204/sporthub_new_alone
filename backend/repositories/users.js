function createUsersRepository(db) {
  return {
    create(email, displayName, passwordHash) {
      const result = db.prepare(
        'INSERT INTO users (email, displayName, passwordHash) VALUES (?, ?, ?)'
      ).run(email, displayName, passwordHash);
      return { id: Number(result.lastInsertRowid), email, displayName };
    },
    findById(id) {
      return db.prepare('SELECT id AS userId, email, displayName FROM users WHERE id = ?').get(id);
    },
    findByEmail(email) {
      return db.prepare('SELECT id, passwordHash FROM users WHERE email = ?').get(email);
    }
  };
}

module.exports = { createUsersRepository };
