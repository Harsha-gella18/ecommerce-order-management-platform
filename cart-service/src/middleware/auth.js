import jwt from 'jsonwebtoken';

/** Match Spring jjwt: pad short secrets to 32 bytes, zero-filled tail. */
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
    if (!h || !h.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = h.slice(7).trim();
    try {
      const payload = jwt.verify(token, key, { algorithms: ['HS256', 'HS384', 'HS512'] });
      const sub = payload.sub;
      req.userId = sub != null ? String(sub) : '';
      req.userRole = payload.role;
      if (!req.userId) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}
