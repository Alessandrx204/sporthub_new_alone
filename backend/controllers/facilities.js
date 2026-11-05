function createFacilityController(service) {
  return {
    list(request, response) {
      response.json(service.list());
    },
    detail(request, response) {
      response.json(service.detail(request.params.id));
    }
  };
}

module.exports = { createFacilityController };
