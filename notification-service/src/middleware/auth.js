import jwt from 'jsonwebtoken';

function jwtKey(secret) {
  const buf = Buffer.from(secret, 'utf8');
  if (buf.length >= 32) return secret;
  const out = Buffer.alloc(32);
  buf.copy(out, 0, 0, buf.length);
  return out;
}

export function authMiddleware(secret) {
  const key = jwtKey(secret);
  return (req, res, next) => {
    if (req.method === 'OPTIONS') return next();
    const h = req.headers.authorization;
    if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const payload = jwt.verify(h.slice(7).trim(), key);
      req.userId = payload.sub;
      req.userRole = payload.role;
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}
