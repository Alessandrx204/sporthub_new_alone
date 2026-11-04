function createBookingController(service) {
  return {
    create(request, response) {
      response.status(201).json(service.create(request.body));
    }
  };
}

module.exports = { createBookingController };
