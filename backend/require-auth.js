function createRequireAuth(service) {
  return (request, response, next) => {
    const identity = service.authenticateToken(request.cookies.auth_token);
    if (!identity) return response.status(401).json({ error: 'Autenticazione richiesta.' });
    request.auth = identity;
    next();
  };
}

module.exports = { createRequireAuth };
