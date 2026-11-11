import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const TOKEN_EXPIRY = '7d';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function setAuthCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `token=${encodeURIComponent(token)}; Max-Age=${COOKIE_MAX_AGE / 1000}; Path=/; HttpOnly; SameSite=Lax${secure}`
  );
}

function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', 'token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax');
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

async function register(req, res) {
  const { email, password, full_name, role } = req.body;

  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ error: 'email, password, full_name et role sont requis' });
  }
  if (!['candidate', 'manager'].includes(role)) {
    return res.status(400).json({ error: 'role doit être "candidate" ou "manager"' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)',
      [email, passwordHash, role, full_name]
    );

    const user = { id: result.insertId, email, role, full_name };
    const token = signToken(user);
    setAuthCookie(res, token);
    res.status(201).json({ user });
  } catch (err) {
    console.error('Erreur register:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email et password sont requis' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, email, password_hash, role, full_name FROM users WHERE email = ?',
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const dbUser = rows[0];
    const passwordMatches = await bcrypt.compare(password, dbUser.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = { id: dbUser.id, email: dbUser.email, role: dbUser.role, full_name: dbUser.full_name };
    const token = signToken(user);
    setAuthCookie(res, token);
    res.json({ user });
  } catch (err) {
    console.error('Erreur login:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function me(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, role, full_name, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('Erreur me:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

function logout(req, res) {
  clearAuthCookie(res);
  res.json({ message: 'Déconnexion réussie' });
}

export { register, login, me, logout };
