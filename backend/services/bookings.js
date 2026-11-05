const { fail } = require('./errors');

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

// Ogni prenotazione occupa un posto. Calcoliamo il picco, non il numero
// totale di intervalli che incrociano la richiesta (potrebbero essere adiacenti).
function hasSpace(bookings, capacity) {
  const events = [];
  for (const booking of bookings) {
    events.push({ time: booking.startTime, change: 1 });
    events.push({ time: booking.endTime, change: -1 });
  }
  events.sort((a, b) => a.time.localeCompare(b.time) || a.change - b.change);
  let occupied = 0;
  for (const event of events) {
    occupied += event.change;
    if (occupied >= capacity) return false;
  }
  return true;
}

function createBookingService(facilities, bookings, now = Date.now) {
  return {
    create(input) {
      const { facilityId, customerName, startTime, endTime } = input || {};
      const start = parseTime(startTime);
      const end = parseTime(endTime);
      if (!Number.isSafeInteger(facilityId) || facilityId < 1 ||
          typeof customerName !== 'string' || !customerName.trim() ||
          !Number.isFinite(start) || !Number.isFinite(end)) {
        fail(400, 'Inserisci impianto, nome e date valide con fuso orario.');
      }
      if (end <= start) fail(400, 'La fine deve essere successiva all’inizio.');
      const booking = {
        facilityId, customerName: customerName.trim(),
        startTime: new Date(start).toISOString(), endTime: new Date(end).toISOString()
      };
      return bookings.transaction(() => {
        const facility = facilities.findById(facilityId);
        if (!facility) fail(404, 'Impianto non trovato.');
        if (facility.active === 0) fail(409, 'Impianto inattivo.');
        if (start <= now()) fail(400, 'Scegli un inizio futuro.');
        if ((end - start) / 60000 < facility.minBookingDurationMinutes) {
          fail(400, `La durata minima è ${facility.minBookingDurationMinutes} minuti.`);
        }
        const overlaps = bookings.findOverlapping(booking);
        if (!hasSpace(overlaps, facility.capacity)) {
          fail(409, facility.capacity === 1
            ? 'Impianto già prenotato in questo intervallo.'
            : 'Non ci sono posti disponibili in questo intervallo.');
        }
        return bookings.create(booking);
      });
    }
  };
}

module.exports = { createBookingService };
