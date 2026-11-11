import jwt from 'jsonwebtoken';

function getCookieToken(cookieHeader) {
  if (!cookieHeader) return null;

  const tokenCookie = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('token='));

  return tokenCookie ? decodeURIComponent(tokenCookie.slice('token='.length)) : null;
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const tokenFromHeader = header?.startsWith('Bearer ')
    ? header.slice('Bearer '.length)
    : null;
  const token = getCookieToken(req.headers.cookie) || tokenFromHeader;

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    next();
  };
}

export { requireAuth, requireRole };
