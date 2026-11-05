function createUsersRepository(db) {
  return {
    create(email, displayName, passwordHash) {
      const result = db.prepare(
        'INSERT INTO users (email, displayName, passwordHash) VALUES (?, ?, ?)'
      ).run(email, displayName, passwordHash);
      return { id: Number(result.lastInsertRowid), email, displayName };
    },
    findByEmail(email) {
      return db.prepare('SELECT id, passwordHash FROM users WHERE email = ?').get(email);
    }
  };
}

module.exports = { createUsersRepository };
