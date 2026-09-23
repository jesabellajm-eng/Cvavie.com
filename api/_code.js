// Helper partagé : codes de connexion à 6 chiffres, sans base de données.
// Le code est dérivé par HMAC(courriel + fenêtre de 10 min) avec un secret serveur,
// donc impossible à deviner et vérifiable de façon stateless sur Vercel.

import crypto from 'node:crypto';

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function getSecret() {
  // AUTH_CODE_SECRET (recommandé) ou, en secours, la clé Stripe déjà configurée.
  return process.env.AUTH_CODE_SECRET || process.env.STRIPE_SECRET_KEY || 'cvavie-code-fallback';
}

function codeFor(normalizedEmail, windowIndex) {
  const h = crypto.createHmac('sha256', getSecret())
    .update(`${normalizedEmail}:${windowIndex}`)
    .digest('hex');
  const num = parseInt(h.slice(0, 8), 16) % 1000000;
  return String(num).padStart(6, '0');
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function generateCode(normalizedEmail) {
  return codeFor(normalizedEmail, Math.floor(Date.now() / WINDOW_MS));
}

// Valide pour la fenêtre courante et la précédente (10 à 20 minutes de validité).
export function verifyCode(normalizedEmail, code) {
  const c = String(code || '').trim();
  if (!/^\d{6}$/.test(c)) return false;
  const w = Math.floor(Date.now() / WINDOW_MS);
  return c === codeFor(normalizedEmail, w) || c === codeFor(normalizedEmail, w - 1);
}
