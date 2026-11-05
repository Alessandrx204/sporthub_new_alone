const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createBookingService } = require('../backend/services/bookings');

test('il service rifiuta la durata insufficiente senza Express né SQLite', () => {
  const facilities = { findById: () => ({ capacity: 1, minBookingDurationMinutes: 90 }) };
  const bookings = {
    transaction: (work) => work(),
    findOverlapping: () => assert.fail('Non deve controllare la disponibilità'),
    create: () => assert.fail('Non deve salvare una prenotazione non valida')
  };
  const service = createBookingService(facilities, bookings, () => Date.parse('2030-11-09T09:00:00Z'));
  assert.throws(() => service.create({
    facilityId: 1, customerName: 'Mario',
    startTime: '2030-11-10T10:00:00Z', endTime: '2030-11-10T11:00:00Z'
  }, { userId: 1, displayName: 'Mario' }), (error) => error.status === 400 && /90 minuti/.test(error.message));
});
