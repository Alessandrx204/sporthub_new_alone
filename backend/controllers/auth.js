function createAuthController(service) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  };
  return {
    me(request, response) {
      const { userId, email, displayName } = request.auth;
      response.json({ id: userId, email, displayName });
    },
    async register(request, response) {
      response.status(201).json(await service.register(request.body));
    },
    logout(request, response) {
      response.clearCookie('auth_token', cookieOptions);
      response.sendStatus(204);
    },
    async login(request, response) {
      const token = await service.login(request.body);
      response.cookie('auth_token', token, {
        ...cookieOptions,
        maxAge: 60 * 60 * 1000
      });
      response.json({ message: 'Login riuscito' });
    }
  };
}

module.exports = { createAuthController };
