const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const Database = require('better-sqlite3');
const { initializeDatabase } = require('../database/setup');
const { createApp } = require('../backend/app');

process.env.JWT_SECRET = 'secret-for-auth-tests-only';

test('accesso dal frontend consente cookie e uscita cancella la credenziale del browser', async () => {
  const db = new Database(':memory:');
  initializeDatabase(db);
  const server = createApp(db).listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const url = `http://127.0.0.1:${server.address().port}`;
    const credentials = { email: 'prova@example.com', displayName: 'Prova', password: 'password-di-prova' };
    async function post(route, body) {
      return fetch(url + route, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:8080' },
        body: JSON.stringify(body)
      });
    }
    assert.equal((await post('/auth/register', credentials)).status, 201);
    const login = await post('/auth/login', credentials);
    assert.equal(login.status, 200);
    assert.equal(login.headers.get('access-control-allow-credentials'), 'true');
    assert.equal(login.headers.get('access-control-allow-origin'), 'http://localhost:8080');
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const profile = await fetch(url + '/me', { headers: { Cookie: cookie } });
    assert.equal(profile.status, 200);
    assert.equal((await profile.json()).displayName, 'Prova');
    const logout = await fetch(url + '/auth/logout', { method: 'POST', headers: { Cookie: cookie } });
    assert.equal(logout.status, 204);
    const cleared = logout.headers.get('set-cookie');
    assert.match(cleared, /auth_token=;/);
    assert.match(cleared, /Expires=Thu, 01 Jan 1970/);
    assert.match(cleared, /HttpOnly/);
    const anonymous = await fetch(url + '/me', { headers: { Cookie: cleared.split(';')[0] } });
    assert.equal(anonymous.status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    db.close();
  }
});
