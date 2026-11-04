const express = require('express');

function toFacility(row) {
  return { ...row, indoor: Boolean(row.indoor) };
}

// Accettiamo istanti ISO con fuso esplicito, senza normalizzare date impossibili.
function parseTime(value) {
  if (typeof value !== 'string') return NaN;
  const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/);
  if (!parts) return NaN;
  const [, year, month, day, hour, minute, second, zone] = parts;
  const y = Number(year);
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][Number(month) - 1];
  if (Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > days ||
      Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) return NaN;
  if (zone !== 'Z' && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4)) > 59)) return NaN;
  return Date.parse(value);
}

function bookingError(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

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

  // Il lock di scrittura precede il controllo: due writer non possono
  // vedere entrambi lo stesso intervallo libero e poi prenotarlo.
  const saveBooking = db.transaction((booking) => {
    const facility = db.prepare('SELECT min_booking_duration_minutes FROM facilities WHERE id = ?').get(booking.facilityId);
    if (!facility) bookingError(404, 'Impianto non trovato.');
    if (Date.parse(booking.startTime) <= now()) bookingError(400, 'Scegli un inizio futuro.');
    const duration = (Date.parse(booking.endTime) - Date.parse(booking.startTime)) / 60000;
    if (duration < facility.min_booking_duration_minutes) {
      bookingError(400, `La durata minima è ${facility.min_booking_duration_minutes} minuti.`);
    }
    const occupied = db.prepare(`
      SELECT id FROM bookings
      WHERE facility_id = ? AND start_time < ? AND end_time > ?
      LIMIT 1
    `).get(booking.facilityId, booking.endTime, booking.startTime);
    if (occupied) bookingError(409, 'Impianto già prenotato in questo intervallo.');

    const result = db.prepare(`
      INSERT INTO bookings (facility_id, customer_name, start_time, end_time)
      VALUES (?, ?, ?, ?)
    `).run(booking.facilityId, booking.customerName, booking.startTime, booking.endTime);
    return { id: Number(result.lastInsertRowid), ...booking };
  });

  app.post('/bookings', (request, response) => {
    const { facilityId, customerName, startTime, endTime } = request.body || {};
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    if (!Number.isSafeInteger(facilityId) || facilityId < 1 ||
        typeof customerName !== 'string' || !customerName.trim() ||
        !Number.isFinite(start) || !Number.isFinite(end)) {
      return response.status(400).json({ error: 'Inserisci impianto, nome e date valide con fuso orario.' });
    }
    if (end <= start) {
      return response.status(400).json({ error: 'La fine deve essere successiva all’inizio.' });
    }
    const booking = saveBooking.immediate({
      facilityId, customerName: customerName.trim(),
      startTime: new Date(start).toISOString(), endTime: new Date(end).toISOString()
    });
    response.status(201).json(booking);
  });

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
