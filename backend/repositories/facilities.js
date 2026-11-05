function toFacility(row) {
  return row ? { ...row, indoor: Boolean(row.indoor) } : undefined;
}

function createFacilitiesRepository(db) {
  const fields = `id, name, type, description, indoor, capacity, active,
    min_booking_duration_minutes AS minBookingDurationMinutes`;
  return {
    findAll() {
      return db.prepare(`SELECT ${fields} FROM facilities ORDER BY id`).all().map(toFacility);
    },
    findById(id) {
      return toFacility(db.prepare(`SELECT ${fields} FROM facilities WHERE id = ?`).get(id));
    }
  };
}

module.exports = { createFacilitiesRepository };
