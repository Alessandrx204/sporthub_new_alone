function createBookingsRepository(db) {
  return {
    transaction(work) {
      // Il lock di scrittura precede il controllo della disponibilità.
      return db.transaction(work).immediate();
    },
    findOverlapping(booking) {
      return db.prepare(`
        SELECT start_time AS startTime, end_time AS endTime FROM bookings
        WHERE facility_id = ? AND start_time < ? AND end_time > ?
      `).all(booking.facilityId, booking.endTime, booking.startTime);
    },
    findByUserId(userId) {
      return db.prepare(`
        SELECT id, facility_id AS facilityId, customer_name AS customerName,
          start_time AS startTime, end_time AS endTime, userId
        FROM bookings WHERE userId = ? ORDER BY id
      `).all(userId);
    },
    create(booking) {
      const result = db.prepare(`
        INSERT INTO bookings (facility_id, customer_name, start_time, end_time, userId)
        VALUES (?, ?, ?, ?, ?)
      `).run(booking.facilityId, booking.customerName, booking.startTime, booking.endTime, booking.userId);
      return { id: Number(result.lastInsertRowid), ...booking };
    }
  };
}

module.exports = { createBookingsRepository };
