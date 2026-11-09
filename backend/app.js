const express = require('express');
const cookieParser = require('cookie-parser');
const { createRequireAuth } = require('./require-auth');
const { createFacilitiesRepository } = require('./repositories/facilities');
const { createBookingsRepository } = require('./repositories/bookings');
const { createFacilityService } = require('./services/facilities');
const { createBookingService } = require('./services/bookings');
const { createFacilityController } = require('./controllers/facilities');
const { createBookingController } = require('./controllers/bookings');

const { createUsersRepository } = require('./repositories/users');
const { createAuthService } = require('./services/auth');
const { createAuthController } = require('./controllers/auth');

function createApp(db, now = Date.now) {
  const app = express();

  app.use((request, response, next) => {
    response.set('Access-Control-Allow-Origin', 'http://localhost:8080');
    response.set('Access-Control-Allow-Credentials', 'true');
    response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type');
    if (request.method === 'OPTIONS') return response.sendStatus(204);
    next();
  });
  app.use(express.json());

  const facilities = createFacilitiesRepository(db);
  const bookings = createBookingsRepository(db);
  const facilityController = createFacilityController(createFacilityService(facilities));
  const bookingController = createBookingController(createBookingService(facilities, bookings, now));

  app.use(cookieParser());
  const authService = createAuthService(createUsersRepository(db), process.env.JWT_SECRET);
  const auth = createAuthController(authService);
  const requireAuth = createRequireAuth(authService);
  app.get('/me', requireAuth, auth.me);
  app.post('/auth/register', auth.register);
  app.post('/auth/login', auth.login);
  app.post('/auth/logout', auth.logout);

  app.get('/facilities', facilityController.list);
  app.get('/facilities/:id', facilityController.detail);
  app.post('/bookings', requireAuth, bookingController.create);
  app.get('/bookings', requireAuth, bookingController.list);

  app.use((error, request, response, next) => {
    if (error.type === 'entity.parse.failed') {
      return response.status(400).json({ error: 'JSON non valido.' });
    }
    const status = error.status >= 400 && error.status < 500 ? error.status : 500;
    response.status(status).json({ error: status === 500 ? 'Impossibile salvare la richiesta. Riprova.' : error.message });
  });

  return app;
}

module.exports = { createApp };
