const { fail } = require('./errors');

function createFacilityService(facilities) {
  return {
    list() {
      return facilities.findAll();
    },
    detail(idText) {
      const id = Number(idText);
      if (!/^[1-9]\d*$/.test(idText) || !Number.isSafeInteger(id)) {
        fail(400, 'ID impianto non valido.');
      }
      const facility = facilities.findById(id);
      if (!facility) fail(404, 'Impianto non trovato.');
      return facility;
    }
  };
}

module.exports = { createFacilityService };
