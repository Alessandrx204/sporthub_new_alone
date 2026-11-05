function createBookingController(service) {
  return {
    list(request, response) {
      response.json(service.list(request.auth));
    },
    create(request, response) {
      response.status(201).json(service.create(request.body, request.auth));
    }
  };
}

module.exports = { createBookingController };
