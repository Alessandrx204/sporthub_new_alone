const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { fail } = require('./errors');

function credentials(input) {
  const { email, password } = input || {};
  const normalized = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ||
      typeof password !== 'string' || !password.trim()) {
    fail(400, 'Email o password non valida.');
  }
  return { email: normalized, password };
}

function createAuthService(users, jwtSecret) {
  return {
    async register(input) {
      const { email, password } = credentials(input);
      const displayName = typeof input.displayName === 'string' ? input.displayName.trim() : '';
      if (!displayName) fail(400, 'Nome da mostrare obbligatorio.');

      const hash = await argon2.hash(password, { type: argon2.argon2id });
      try {
        return users.create(email, displayName, hash);
      } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') fail(409, 'Email già registrata.');
        throw error;
      }
    },
    authenticateToken(token) {
      if (!token || !jwtSecret) return null;
      let payload;
      try {
        payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
      } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) return null;
        throw error;
      }
      if (typeof payload?.sub !== 'string' || !/^[1-9]\d*$/.test(payload.sub)) return null;
      const userId = Number(payload.sub);
      if (!Number.isSafeInteger(userId) || userId <= 0 || !Number.isFinite(payload.exp)) return null;
      return users.findById(userId);
    },
    async login(input) {
      const { email, password } = credentials(input);
      const user = users.findByEmail(email);
      if (!user || !(await argon2.verify(user.passwordHash, password))) {
        fail(401, 'Credenziali non valide.');
      }
      if (!jwtSecret) throw new Error('JWT_SECRET non configurato');
      return jwt.sign({}, jwtSecret, {
        subject: String(user.id), expiresIn: '1h', algorithm: 'HS256'
      });
    }
  };
}

module.exports = { createAuthService };
