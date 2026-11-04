const express = require('express');

function toFacility(row) {
  return { ...row, indoor: Boolean(row.indoor) };
}

function createApp(db) {
  const app = express();

  app.use((request, response, next) => {
    response.set('Access-Control-Allow-Origin', 'http://localhost:8080');
    next();
  });

  app.get('/facilities', (request, response) => {
    const rows = db.prepare(`
      SELECT id, name, type, description, indoor,
        min_booking_duration_minutes AS minBookingDurationMinutes
      FROM facilities
      ORDER BY id
    `).all();
    response.json(rows.map(toFacility));
  });

  app.get('/facilities/:id', (request, response) => {
    const idText = request.params.id;
    const id = Number(idText);
    if (!/^[1-9]\d*$/.test(idText) || !Number.isSafeInteger(id)) {
      return response.status(400).json({ error: 'ID impianto non valido.' });
    }

    const row = db.prepare(`
      SELECT id, name, type, description, indoor,
        min_booking_duration_minutes AS minBookingDurationMinutes
      FROM facilities
      WHERE id = ?
    `).get(id);

    if (!row) {
      return response.status(404).json({ error: 'Impianto non trovato.' });
    }

    response.json(toFacility(row));
  });

  return app;
}

module.exports = { createApp };
