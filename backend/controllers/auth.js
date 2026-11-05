function createAuthController(service) {
  return {
    me(request, response) {
      const { userId, email, displayName } = request.auth;
      response.json({ id: userId, email, displayName });
    },
    async register(request, response) {
      response.status(201).json(await service.register(request.body));
    },
    async login(request, response) {
      const token = await service.login(request.body);
      response.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 1000
      });
      response.json({ message: 'Login riuscito' });
    }
  };
}

module.exports = { createAuthController };
