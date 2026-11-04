const express = require('express');
const { createFacilitiesRepository } = require('./repositories/facilities');
const { createBookingsRepository } = require('./repositories/bookings');
const { createFacilityService } = require('./services/facilities');
const { createBookingService } = require('./services/bookings');
const { createFacilityController } = require('./controllers/facilities');
const { createBookingController } = require('./controllers/bookings');

function createApp(db, now = Date.now) {
  const app = express();

  app.use((request, response, next) => {
    response.set('Access-Control-Allow-Origin', 'http://localhost:8080');
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

  app.get('/facilities', facilityController.list);
  app.get('/facilities/:id', facilityController.detail);
  app.post('/bookings', bookingController.create);

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
